import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { WalletsService } from '../wallets/wallets.service';
import { TelegramNotifyService } from '../../common/telegram-notify.service';
import { DepositStatus, generateDepositNumber, TxDirection, WalletTxType } from '@telegram-store/shared';
import { BlockchainPaymentVerifier } from '@telegram-store/payments';

@Injectable()
export class DepositsService {
  private verifier = new BlockchainPaymentVerifier();

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletsService: WalletsService,
    private readonly telegramNotify: TelegramNotifyService,
  ) {}

  async getNetworks() {
    return this.prisma.paymentNetwork.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async getAllNetworksAdmin() {
    return this.prisma.paymentNetwork.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async updateNetwork(
    id: string,
    data: {
      name?: string;
      accountTitle?: string;
      receivingAddress?: string;
      instructions?: string;
      minDeposit?: number;
      isActive?: boolean;
      currency?: string;
      symbol?: string;
      type?: string;
      sortOrder?: number;
    },
  ) {
    return this.prisma.paymentNetwork.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.accountTitle !== undefined ? { accountTitle: data.accountTitle } : {}),
        ...(data.receivingAddress !== undefined ? { receivingAddress: data.receivingAddress } : {}),
        ...(data.instructions !== undefined ? { instructions: data.instructions } : {}),
        ...(data.minDeposit !== undefined ? { minDeposit: data.minDeposit } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(data.currency !== undefined ? { currency: data.currency } : {}),
        ...(data.symbol !== undefined ? { symbol: data.symbol } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
      },
    });
  }

  async createNetwork(data: {
    name: string;
    chain: string;
    currency?: string;
    symbol?: string;
    type?: string;
    accountTitle?: string;
    receivingAddress: string;
    instructions?: string;
    minDeposit?: number;
    isActive?: boolean;
    sortOrder?: number;
  }) {
    return this.prisma.paymentNetwork.create({
      data: {
        name: data.name,
        chain: data.chain,
        currency: data.currency || (data.type === 'LOCAL_PK' ? 'PKR' : 'USDT'),
        symbol: data.symbol || (data.type === 'LOCAL_PK' ? 'PKR' : 'USDT'),
        type: data.type || 'LOCAL_PK',
        accountTitle: data.accountTitle || null,
        receivingAddress: data.receivingAddress,
        instructions: data.instructions || null,
        minDeposit: data.minDeposit || 1.0,
        isActive: data.isActive !== false,
        sortOrder: data.sortOrder || 0,
      },
    });
  }

  async deleteNetwork(id: string) {
    const hasDeposits = await this.prisma.deposit.count({ where: { paymentNetworkId: id } });
    if (hasDeposits > 0) {
      return this.prisma.paymentNetwork.update({
        where: { id },
        data: { isActive: false },
      });
    }
    return this.prisma.paymentNetwork.delete({ where: { id } });
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

    // If Pakistani local payment (JazzCash, EasyPaisa, Bank), route directly to MANUAL_REVIEW queue
    if (network.type === 'LOCAL_PK') {
      return this.prisma.deposit.update({
        where: { id: deposit.id },
        data: {
          status: DepositStatus.MANUAL_REVIEW,
          verificationData: {
            method: network.name,
            accountTitle: network.accountTitle,
            receivingAddress: network.receivingAddress,
            tid: cleanedHash,
            type: 'LOCAL_PK',
            currency: network.currency,
          } as any,
        },
        include: { network: true },
      });
    }

    // Run verification attempt for on-chain crypto
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
    const updatedDeposit = await this.prisma.$transaction(async (tx) => {
      const deposit = await tx.deposit.findUnique({
        where: { id: depositId },
        include: { network: true, wallet: { include: { user: true } } },
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

      const updated = await tx.deposit.update({
        where: { id: depositId },
        data: {
          status: DepositStatus.CREDITED,
          verifiedAmount,
          creditedAt: new Date(),
          verifiedAt: new Date(),
          verificationData: verificationData || deposit.verificationData,
        },
        include: {
          network: true,
          wallet: {
            include: { user: true },
          },
        },
      });

      return updated;
    });

    // Send instant Telegram notification to the customer
    try {
      const tgUserId = updatedDeposit.wallet?.user?.telegramUserId;
      if (tgUserId) {
        const [rateSetting, currentWallet] = await Promise.all([
          this.prisma.systemSetting.findUnique({ where: { key: 'usd_to_pkr_rate' } }),
          this.prisma.wallet.findUnique({ where: { id: updatedDeposit.walletId } }),
        ]);

        const pkrRate = rateSetting ? Number(rateSetting.value) || 280 : 280;
        const newBalance = Number(currentWallet?.cachedBalance || 0);
        const newBalancePkr = (newBalance * pkrRate).toLocaleString('en-US', { maximumFractionDigits: 0 });
        const creditedUsd = Number(verifiedAmount).toFixed(2);

        const vData: any = updatedDeposit.verificationData || {};
        const pkrPaid = vData?.pkrAmount
          ? Number(vData.pkrAmount).toLocaleString()
          : (Number(verifiedAmount) * pkrRate).toLocaleString('en-US', { maximumFractionDigits: 0 });

        const message =
          `🎉 *Payment Confirmed & Balance Credited!*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `🧾 *Deposit Ref:* \`#${updatedDeposit.depositNumber}\`\n` +
          `💳 *Payment Method:* *${updatedDeposit.network.name}*\n` +
          `💵 *Local Paid Amount:* *Rs. ${pkrPaid} PKR*\n` +
          `💰 *Wallet Credited:* *$${creditedUsd} USD*\n` +
          `👛 *New Available Balance:* *$${newBalance.toFixed(2)} USD* (Rs. ${newBalancePkr} PKR)\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `✅ Your balance is live! Tap below to start browsing products.`;

        await this.telegramNotify.sendMessage({
          telegramUserId: tgUserId,
          text: message,
          replyMarkup: {
            inline_keyboard: [
              [
                { text: '🛒 Browse Products', callback_data: 'nav_buy' },
                { text: '💼 My Wallet', callback_data: 'nav_wallet' },
              ],
              [{ text: '🏠 Main Menu', callback_data: 'nav_main' }],
            ],
          },
        });
      }
    } catch (err: any) {
      console.error('Failed to dispatch deposit Telegram notification:', err.message);
    }

    return updatedDeposit;
  }
}
