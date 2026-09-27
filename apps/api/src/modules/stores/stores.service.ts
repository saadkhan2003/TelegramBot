import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class StoresService {
  constructor(private readonly prisma: PrismaService) {}

  async findStoresForAdmin(adminId: string) {
    // STRICT ISOLATION: Every admin only sees stores they own or are a member of.
    // No system-role bypass — an OWNER of store A cannot see store B unless they
    // are explicitly added as a member of that store.
    const stores = await this.prisma.store.findMany({
      where: {
        OR: [
          { ownerId: adminId },
          { members: { some: { adminId } } },
        ],
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: {
            products: true,
            orders: true,
            categories: true,
            inventoryItems: true,
            members: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return stores.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      tagline: s.tagline,
      currency: s.currency,
      botUsername: s.botUsername,
      botStatus: s.botStatus,
      hasBotToken: Boolean(s.botToken && s.botToken.length > 10),
      owner: s.owner,
      counts: s._count,
      createdAt: s.createdAt,
    }));
  }

  async findOne(id: string, adminId: string) {
    const store = await this.prisma.store.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: {
            admin: { select: { id: true, name: true, email: true } },
          },
        },
        _count: {
          select: {
            products: true,
            orders: true,
            categories: true,
            inventoryItems: true,
          },
        },
      },
    });

    if (!store) throw new NotFoundException('Store not found');
    return store;
  }

  async createStore(
    data: {
      name: string;
      slug?: string;
      tagline?: string;
      currency?: string;
      botToken?: string;
      welcomeMessage?: string;
      supportUsername?: string;
    },
    adminId: string,
  ) {
    const name = data.name.trim();
    if (!name) throw new BadRequestException('Store name is required');

    let slug = data.slug
      ? data.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')
      : name.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    if (!slug) slug = `store-${Date.now().toString().slice(-6)}`;

    // Ensure uniqueness
    const existing = await this.prisma.store.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
    }

    // If bot token is provided, test it
    let botUsername: string | undefined;
    let botStatus = 'INACTIVE';
    if (data.botToken && data.botToken.trim()) {
      const verify = await this.verifyBotToken(data.botToken.trim());
      if (verify.ok) {
        botUsername = verify.bot?.username;
        botStatus = 'ACTIVE';
      }
    }

    const store = await this.prisma.store.create({
      data: {
        name,
        slug,
        tagline: data.tagline?.trim(),
        currency: data.currency?.toUpperCase() || 'USD',
        botToken: data.botToken?.trim() || null,
        botUsername,
        botStatus,
        welcomeMessage: data.welcomeMessage?.trim(),
        supportUsername: data.supportUsername?.trim(),
        ownerId: adminId,
        members: {
          create: {
            adminId,
            role: 'OWNER',
          },
        },
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    return store;
  }

  async updateStore(
    id: string,
    data: {
      name?: string;
      tagline?: string;
      currency?: string;
      botToken?: string;
      welcomeMessage?: string;
      supportUsername?: string;
      botStatus?: string;
    },
    adminId: string,
  ) {
    const store = await this.prisma.store.findUnique({ where: { id } });
    if (!store) throw new NotFoundException('Store not found');

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.tagline !== undefined) updateData.tagline = data.tagline.trim();
    if (data.currency !== undefined) updateData.currency = data.currency.toUpperCase();
    if (data.welcomeMessage !== undefined) updateData.welcomeMessage = data.welcomeMessage.trim();
    if (data.supportUsername !== undefined) updateData.supportUsername = data.supportUsername.trim();
    if (data.botStatus !== undefined) updateData.botStatus = data.botStatus;

    if (data.botToken !== undefined) {
      const token = data.botToken.trim();
      updateData.botToken = token || null;
      if (token) {
        const verify = await this.verifyBotToken(token);
        if (verify.ok) {
          updateData.botUsername = verify.bot?.username;
          updateData.botStatus = 'ACTIVE';
        } else {
          updateData.botStatus = 'ERROR';
        }
      } else {
        updateData.botStatus = 'INACTIVE';
      }
    }

    return this.prisma.store.update({
      where: { id },
      data: updateData,
    });
  }

  async verifyBotToken(token: string) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      const data = await res.json();
      if (data.ok) {
        return {
          ok: true,
          bot: {
            id: data.result.id,
            username: data.result.username,
            firstName: data.result.first_name,
            canJoinGroups: data.result.can_join_groups,
          },
        };
      }
      return { ok: false, error: data.description || 'Invalid Telegram Bot Token' };
    } catch (err: any) {
      return { ok: false, error: `Connection failed: ${err.message}` };
    }
  }
}
