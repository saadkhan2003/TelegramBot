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
}
