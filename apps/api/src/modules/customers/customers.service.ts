import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { UserStatus } from '@telegram-store/shared';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Syncs Telegram user on /start or any interaction
   */
  async getOrCreateTelegramUser(data: {
    telegramUserId: bigint | number | string;
    telegramUsername?: string;
    firstName?: string;
    lastName?: string;
    preferredLanguage?: string;
    referredByTelegramId?: bigint | number | string;
  }) {
    const tgId = BigInt(data.telegramUserId);

    let user = await this.prisma.user.findUnique({
      where: { telegramUserId: tgId },
      include: { wallet: true },
    });

    if (!user) {
      // Check referrer
      let referrerUserId: string | undefined;
      if (data.referredByTelegramId) {
        const refTgId = BigInt(data.referredByTelegramId);
        if (refTgId !== tgId) {
          const referrer = await this.prisma.user.findUnique({
            where: { telegramUserId: refTgId },
          });
          if (referrer) {
            referrerUserId = referrer.id;
          }
        }
      }

      user = await this.prisma.user.create({
        data: {
          telegramUserId: tgId,
          telegramUsername: data.telegramUsername,
          firstName: data.firstName,
          lastName: data.lastName,
          preferredLanguage: data.preferredLanguage || 'en',
          referredByUserId: referrerUserId,
          wallet: {
            create: {
              currency: 'USD',
              cachedBalance: 0,
            },
          },
        },
        include: { wallet: true },
      });

      if (referrerUserId) {
        await this.prisma.referral.create({
          data: {
            referrerUserId,
            referredUserId: user.id,
            source: 'telegram_start_link',
          },
        });
      }
    } else {
      // Update last seen and profile changes
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          telegramUsername: data.telegramUsername,
          firstName: data.firstName,
          lastName: data.lastName,
          lastSeenAt: new Date(),
        },
        include: { wallet: true },
      });
    }

    return user;
  }

  async findAll(params?: {
    storeId?: string;
    search?: string;
    status?: UserStatus;
    page?: number;
    limit?: number;
  }) {
    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params?.status) where.status = params.status;
    // Scope customers to those who have interacted with this store
    if (params?.storeId) {
      where.orders = { some: { storeId: params.storeId } };
    }
    if (params?.search) {
      where.OR = [
        { telegramUsername: { contains: params.search, mode: 'insensitive' } },
        { firstName: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          wallet: true,
          _count: {
            select: { orders: true, referralsMade: true },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    // Format BigInt for JSON serialization
    const formatted = users.map((u) => ({
      ...u,
      telegramUserId: u.telegramUserId.toString(),
    }));

    return {
      data: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        wallet: true,
        orders: { take: 10, orderBy: { createdAt: 'desc' } },
        deposits: { take: 10, orderBy: { createdAt: 'desc' } },
        supportTickets: { take: 5, orderBy: { createdAt: 'desc' } },
        warrantyClaims: { take: 5, orderBy: { createdAt: 'desc' } },
        referralRecord: { include: { referrer: true } },
        referralsOriginated: { include: { referred: true } },
      },
    });
    if (!user) throw new NotFoundException('Customer not found');

    return {
      ...user,
      telegramUserId: user.telegramUserId.toString(),
    };
  }

  async updateStatus(id: string, status: UserStatus) {
    await this.findOne(id);
    const updated = await this.prisma.user.update({
      where: { id },
      data: { status },
    });
    return {
      ...updated,
      telegramUserId: updated.telegramUserId.toString(),
    };
  }

  async delete(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Customer not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.user.updateMany({
        where: { referredByUserId: id },
        data: { referredByUserId: null },
      });
      await tx.referral.deleteMany({
        where: { OR: [{ referrerUserId: id }, { referredUserId: id }] },
      });
      await tx.broadcastDelivery.deleteMany({ where: { userId: id } });
      await tx.supportTicket.deleteMany({ where: { userId: id } });
      await tx.warrantyClaim.deleteMany({ where: { userId: id } });
      await tx.deposit.deleteMany({ where: { userId: id } });
      const orders = await tx.order.findMany({ where: { userId: id }, select: { id: true } });
      const orderIds = orders.map((o) => o.id);
      if (orderIds.length > 0) {
        await tx.refund.deleteMany({ where: { orderId: { in: orderIds } } });
        await tx.warrantyClaim.deleteMany({ where: { orderId: { in: orderIds } } });
        await tx.referralCommission.deleteMany({ where: { orderId: { in: orderIds } } });
        await tx.delivery.deleteMany({ where: { orderItem: { orderId: { in: orderIds } } } });
        await tx.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
        await tx.order.deleteMany({ where: { id: { in: orderIds } } });
      }
      const wallet = await tx.wallet.findUnique({ where: { userId: id } });
      if (wallet) {
        await tx.walletTransaction.deleteMany({ where: { walletId: wallet.id } });
        await tx.wallet.delete({ where: { id: wallet.id } });
      }
      await tx.user.delete({ where: { id } });
    });

    return { success: true, id };
  }

  async bulkDelete(ids: string[]) {
    if (!ids || ids.length === 0) return { success: true, count: 0 };

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.user.updateMany({
        where: { referredByUserId: { in: ids } },
        data: { referredByUserId: null },
      });
      await tx.referral.deleteMany({
        where: { OR: [{ referrerUserId: { in: ids } }, { referredUserId: { in: ids } }] },
      });
      await tx.broadcastDelivery.deleteMany({ where: { userId: { in: ids } } });
      await tx.supportTicket.deleteMany({ where: { userId: { in: ids } } });
      await tx.warrantyClaim.deleteMany({ where: { userId: { in: ids } } });
      await tx.deposit.deleteMany({ where: { userId: { in: ids } } });
      const orders = await tx.order.findMany({ where: { userId: { in: ids } }, select: { id: true } });
      const orderIds = orders.map((o) => o.id);
      if (orderIds.length > 0) {
        await tx.refund.deleteMany({ where: { orderId: { in: orderIds } } });
        await tx.warrantyClaim.deleteMany({ where: { orderId: { in: orderIds } } });
        await tx.referralCommission.deleteMany({ where: { orderId: { in: orderIds } } });
        await tx.delivery.deleteMany({ where: { orderItem: { orderId: { in: orderIds } } } });
        await tx.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
        await tx.order.deleteMany({ where: { id: { in: orderIds } } });
      }
      const wallets = await tx.wallet.findMany({ where: { userId: { in: ids } }, select: { id: true } });
      const walletIds = wallets.map((w) => w.id);
      if (walletIds.length > 0) {
        await tx.walletTransaction.deleteMany({ where: { walletId: { in: walletIds } } });
        await tx.wallet.deleteMany({ where: { id: { in: walletIds } } });
      }
      return tx.user.deleteMany({ where: { id: { in: ids } } });
    });

    return { success: true, count: result.count };
  }
}
