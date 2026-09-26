import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { Prisma } from '@telegram-store/database';
import { TxDirection, TxStatus, WalletTxType } from '@telegram-store/shared';

@Injectable()
export class WalletsService {
  constructor(private readonly prisma: PrismaService) {}

  async getWalletByUserId(userId: string) {
    let wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, telegramUserId: true, telegramUsername: true, firstName: true } },
      },
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: {
          userId,
          currency: 'USD',
          cachedBalance: 0,
        },
        include: {
          user: { select: { id: true, telegramUserId: true, telegramUsername: true, firstName: true } },
        },
      });
    }

    return wallet;
  }

  async getTransactions(params: {
    walletId?: string;
    userId?: string;
    type?: WalletTxType;
    page?: number;
    limit?: number;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.walletId) where.walletId = params.walletId;
    if (params.userId) where.wallet = { userId: params.userId };
    if (params.type) where.type = params.type;

    const [items, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          wallet: {
            include: {
              user: {
                select: { id: true, telegramUserId: true, telegramUsername: true, firstName: true },
              },
            },
          },
          admin: { select: { id: true, email: true } },
        },
      }),
      this.prisma.walletTransaction.count({ where }),
    ]);

    const sanitizedItems = items.map((tx) => ({
      ...tx,
      wallet: tx.wallet
        ? {
            ...tx.wallet,
            user: tx.wallet.user
              ? {
                  ...tx.wallet.user,
                  telegramUserId: tx.wallet.user.telegramUserId?.toString(),
                }
              : null,
          }
        : null,
    }));

    return {
      data: sanitizedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Performs an atomic ledger adjustment on a customer's wallet.
   * Can be run inside an existing Prisma interactive transaction or directly.
   */
  async executeLedgerTransaction(
    tx: Prisma.TransactionClient,
    params: {
      walletId: string;
      type: WalletTxType;
      direction: TxDirection;
      amount: number | Prisma.Decimal;
      referenceType?: string;
      referenceId?: string;
      description: string;
      createdByAdminId?: string;
    },
  ) {
    const amountDec = new Prisma.Decimal(params.amount);
    if (amountDec.lessThanOrEqualTo(0)) {
      throw new BadRequestException('Transaction amount must be strictly positive');
    }

    // Lock the wallet row
    const [lockedWallet] = await tx.$queryRaw<
      { id: string; cached_balance: string; user_id: string }[]
    >`SELECT id, cached_balance, user_id FROM wallets WHERE id = ${params.walletId}::uuid FOR UPDATE`;

    if (!lockedWallet) {
      throw new NotFoundException('Wallet not found');
    }

    const currentBalance = new Prisma.Decimal(lockedWallet.cached_balance);
    let newBalance: Prisma.Decimal;

    if (params.direction === TxDirection.DEBIT) {
      if (currentBalance.lessThan(amountDec)) {
        throw new BadRequestException(
          `Insufficient balance. Available: $${currentBalance.toFixed(2)}, required: $${amountDec.toFixed(2)}`,
        );
      }
      newBalance = currentBalance.minus(amountDec);
    } else {
      newBalance = currentBalance.plus(amountDec);
    }

    // 1. Create transaction record
    const createdTx = await tx.walletTransaction.create({
      data: {
        walletId: params.walletId,
        type: params.type,
        direction: params.direction,
        amount: amountDec,
        currency: 'USD',
        referenceType: params.referenceType,
        referenceId: params.referenceId,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        description: params.description,
        status: TxStatus.COMPLETED,
        createdByAdminId: params.createdByAdminId,
      },
    });

    // 2. Update wallet stats
    const updateData: Prisma.WalletUpdateInput = {
      cachedBalance: newBalance,
    };

    if (params.type === WalletTxType.DEPOSIT) {
      updateData.totalDeposited = { increment: amountDec };
    } else if (params.type === WalletTxType.ORDER_PURCHASE) {
      updateData.totalSpent = { increment: amountDec };
    } else if (params.type === WalletTxType.REFUND) {
      updateData.totalRefunded = { increment: amountDec };
    } else if (params.type === WalletTxType.REFERRAL_COMMISSION) {
      updateData.referralEarnings = { increment: amountDec };
    }

    await tx.wallet.update({
      where: { id: params.walletId },
      data: updateData,
    });

    return {
      transaction: createdTx,
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
    };
  }

  /**
   * Manual admin wallet adjustment
   */
  async adjustWallet(params: {
    userId: string;
    direction: TxDirection;
    amount: number;
    reason: string;
    adminId: string;
  }) {
    const wallet = await this.getWalletByUserId(params.userId);

    return this.prisma.$transaction(async (tx) => {
      return this.executeLedgerTransaction(tx, {
        walletId: wallet.id,
        type: params.direction === TxDirection.CREDIT ? WalletTxType.ADMIN_CREDIT : WalletTxType.ADMIN_DEBIT,
        direction: params.direction,
        amount: params.amount,
        description: `Admin manual adjustment: ${params.reason}`,
        createdByAdminId: params.adminId,
      });
    });
  }
}
