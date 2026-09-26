import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { WalletsService } from '../wallets/wallets.service';
import { DepositStatus, generateDepositNumber, TxDirection, WalletTxType } from '@telegram-store/shared';
import { BlockchainPaymentVerifier } from '@telegram-store/payments';

@Injectable()
export class DepositsService {
  private verifier = new BlockchainPaymentVerifier();

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletsService: WalletsService,
  ) {}

  async getNetworks() {
    return this.prisma.paymentNetwork.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findAll(params?: {
    userId?: string;
    status?: DepositStatus;
    page?: number;
    limit?: number;
  }) {
    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params?.userId) where.userId = params.userId;
    if (params?.status) where.status = params.status;

    const [items, total] = await Promise.all([
      this.prisma.deposit.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, telegramUserId: true, telegramUsername: true, firstName: true } },
          network: true,
          wallet: true,
        },
      }),
      this.prisma.deposit.count({ where }),
    ]);

    return {
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Customer initiates a deposit by submitting a transaction hash
   */
  async submitDeposit(params: {
    userId: string;
    paymentNetworkId: string;
    transactionHash: string;
    reportedAmount?: number;
  }) {
    const network = await this.prisma.paymentNetwork.findUnique({
      where: { id: params.paymentNetworkId },
    });
    if (!network || !network.isActive) {
      throw new BadRequestException('Selected payment network is not active');
    }

    const cleanedHash = params.transactionHash.trim();

    // Check duplicate
    const existing = await this.prisma.deposit.findFirst({
      where: {
        paymentNetworkId: network.id,
        transactionHash: cleanedHash,
      },
    });

    if (existing) {
      throw new ConflictException(
        'This transaction hash has already been submitted or credited.',
      );
    }

    const wallet = await this.walletsService.getWalletByUserId(params.userId);

    const depositNumber = generateDepositNumber();

    // Create deposit in AWAITING_TXID / VERIFYING
    const deposit = await this.prisma.deposit.create({
      data: {
        depositNumber,
        userId: params.userId,
        walletId: wallet.id,
        paymentNetworkId: network.id,
        depositAddress: network.receivingAddress,
        transactionHash: cleanedHash,
        reportedAmount: params.reportedAmount,
        status: DepositStatus.VERIFYING,
      },
      include: { network: true },
    });

    // Run verification attempt
    const verification = await this.verifier.verifyTransaction({
      network: network.name,
      expectedDestinationAddress: network.receivingAddress,
      transactionHash: cleanedHash,
      minimumDepositUsd: Number(network.minDeposit),
    });

    if (verification.isValid && verification.actualAmount) {
      return this.creditDeposit(deposit.id, verification.actualAmount, verification);
    } else {
      // Keep in MANUAL_REVIEW or VERIFYING
      return this.prisma.deposit.update({
        where: { id: deposit.id },
        data: {
          status: DepositStatus.MANUAL_REVIEW,
          verificationData: verification.rawDetails as any,
        },
        include: { network: true },
      });
    }
  }

  /**
   * Atomic wallet credit for a confirmed deposit (PRD Section 39)
   */
  async creditDeposit(
    depositId: string,
    verifiedAmount: number,
    verificationData?: any,
    adminId?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const deposit = await tx.deposit.findUnique({
        where: { id: depositId },
        include: { network: true },
      });

      if (!deposit) throw new NotFoundException('Deposit not found');
      if (deposit.status === DepositStatus.CREDITED) {
        throw new BadRequestException('Deposit has already been credited');
      }

      // Execute atomic ledger entry
      await this.walletsService.executeLedgerTransaction(tx, {
        walletId: deposit.walletId,
        type: WalletTxType.DEPOSIT,
        direction: TxDirection.CREDIT,
        amount: verifiedAmount,
        referenceType: 'DEPOSIT',
        referenceId: deposit.id,
        description: `Deposit via ${deposit.network.name} (${deposit.depositNumber})`,
        createdByAdminId: adminId,
      });

      const updatedDeposit = await tx.deposit.update({
        where: { id: depositId },
        data: {
          status: DepositStatus.CREDITED,
          verifiedAmount,
          creditedAt: new Date(),
          verifiedAt: new Date(),
          verificationData: verificationData || deposit.verificationData,
        },
        include: { network: true, wallet: true },
      });

      return updatedDeposit;
    });
  }
}
