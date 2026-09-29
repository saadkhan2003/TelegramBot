import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllSettings(storeId?: string) {
    const settings = await this.prisma.systemSetting.findMany({
      orderBy: { key: 'asc' },
    });

    if (!storeId) {
      return settings
        .filter((s) => !s.key.startsWith('store_') && !s.key.startsWith('bot_screen_'))
        .map((s) => ({
          ...s,
          value: s.isSensitive ? '••••••••' : s.value,
        }));
    }

    const storePrefix = `store_${storeId}_`;
    const storeOverrides = new Map<string, any>();

    for (const s of settings) {
      if (s.key.startsWith(storePrefix)) {
        const cleanKey = s.key.replace(storePrefix, '');
        storeOverrides.set(cleanKey, s.value);
      }
    }

    // Default sanitized values for store-specific fields for new stores
    const storeSpecificKeys: Record<string, any> = {
      store_name: '',
      store_tagline: '',
      welcome_message: '',
      support_username: '',
      announcement_channel: '',
      terms_text: 'All digital licenses and codes are guaranteed authentic with 30-day warranty.',
      owner_telegram_id: '',
      maintenance_message: 'Our store is temporarily undergoing scheduled maintenance. We will be right back!',
      fulfillment_notice: 'Your order is being sourced from our wholesaler. Delivery typically completes in 5-30 minutes.',
    };

    const baseSettings = settings.filter(
      (s) => !s.key.startsWith('store_') && !s.key.startsWith('bot_screen_')
    );

    const result = baseSettings.map((s) => {
      if (storeOverrides.has(s.key)) {
        return {
          ...s,
          value: storeOverrides.get(s.key),
        };
      }
      if (s.key in storeSpecificKeys) {
        return {
          ...s,
          value: storeSpecificKeys[s.key],
        };
      }
      return {
        ...s,
        value: s.isSensitive ? '••••••••' : s.value,
      };
    });

    for (const [cleanKey, value] of storeOverrides.entries()) {
      if (!baseSettings.some((b) => b.key === cleanKey)) {
        result.push({
          id: cleanKey,
          key: cleanKey,
          value,
          description: null,
          isSensitive: false,
          updatedAt: new Date(),
        } as any);
      }
    }

    return result;
  }

  async updateSetting(key: string, value: any, adminId: string, storeId?: string) {
    const settingKey = storeId ? `store_${storeId}_${key}` : key;
    const existing = await this.prisma.systemSetting.findUnique({ where: { key: settingKey } });

    const updated = await this.prisma.systemSetting.upsert({
      where: { key: settingKey },
      update: { value },
      create: { key: settingKey, value },
    });

    // Record audit log
    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: 'UPDATE_SYSTEM_SETTING',
        resourceType: 'system_settings',
        resourceId: settingKey,
        beforeData: existing ? (existing.value as any) : null,
        afterData: value,
      },
    });

    return updated;
  }

  async getTranslations(languageCode?: string) {
    return this.prisma.translation.findMany({
      where: languageCode ? { languageCode } : undefined,
      orderBy: [{ key: 'asc' }, { languageCode: 'asc' }],
    });
  }

  async updateTranslation(key: string, languageCode: string, value: string) {
    return this.prisma.translation.upsert({
      where: {
        key_languageCode: { key, languageCode },
      },
      update: { value },
      create: { key, languageCode, value },
    });
  }

  async getAuditLogs(params?: {
    page?: number;
    limit?: number;
    resourceType?: string;
    storeId?: string;
    adminId?: string;
  }) {
    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params?.resourceType) where.resourceType = params.resourceType;

    // Strict Store Isolation for Audit Logs
    if (params?.storeId) {
      const store = await this.prisma.store.findUnique({
        where: { id: params.storeId },
        include: { members: { select: { adminId: true } } },
      });
      if (store) {
        const allowedAdminIds = [store.ownerId, ...store.members.map((m) => m.adminId)];
        where.adminId = { in: allowedAdminIds };
      } else if (params.adminId) {
        where.adminId = params.adminId;
      }
    } else if (params?.adminId) {
      where.adminId = params.adminId;
    }

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          admin: { select: { id: true, email: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
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

  async getBotScreens(storeId?: string) {
    if (!storeId) {
      return { screens: {}, deletedKeys: [] };
    }
    const prefix = `bot_screen_${storeId}_`;
    const records = await this.prisma.systemSetting.findMany({
      where: { key: { startsWith: prefix } },
    });
    const screens = records.reduce((acc: Record<string, any>, r) => {
      acc[r.key.replace(prefix, '')] = r.value;
      return acc;
    }, {});

    const delKey = `bot_deleted_screens_${storeId}`;
    const deletedSetting = await this.prisma.systemSetting.findUnique({
      where: { key: delKey },
    });
    const deletedKeys: string[] = Array.isArray(deletedSetting?.value)
      ? (deletedSetting.value as string[])
      : [];

    return { screens, deletedKeys };
  }

  async saveBotScreen(key: string, data: { components: any[]; meta?: any; triggers?: any }, storeId?: string) {
    const settingKey = storeId ? `bot_screen_${storeId}_${key}` : `bot_screen_${key}`;
    const value = {
      components: data.components,
      triggers: data.triggers || data.meta?.triggers || null,
      meta: data.meta || null,
    };

    // If previously in deleted keys for this store, un-delete it
    if (storeId) {
      const delKey = `bot_deleted_screens_${storeId}`;
      const existing = await this.prisma.systemSetting.findUnique({ where: { key: delKey } });
      if (existing && Array.isArray(existing.value)) {
        const updated = (existing.value as string[]).filter((k) => k !== key);
        await this.prisma.systemSetting.update({
          where: { key: delKey },
          data: { value: updated },
        });
      }
    }

    return this.prisma.systemSetting.upsert({
      where: { key: settingKey },
      create: {
        key: settingKey,
        value,
        description: `Bot screen layout for: ${key}${storeId ? ` (store: ${storeId})` : ''}`,
      },
      update: { value },
    });
  }

  async deleteBotScreen(key: string, storeId?: string) {
    if (key === 'welcome') {
      throw new BadRequestException('The Welcome screen cannot be deleted');
    }

    const settingKey = storeId ? `bot_screen_${storeId}_${key}` : `bot_screen_${key}`;
    await this.prisma.systemSetting.deleteMany({
      where: { key: settingKey },
    });

    // Mark as deleted for this specific store so it never leaks back from defaults
    if (storeId) {
      const delKey = `bot_deleted_screens_${storeId}`;
      const existing = await this.prisma.systemSetting.findUnique({ where: { key: delKey } });
      const currentList: string[] = Array.isArray(existing?.value) ? (existing.value as string[]) : [];
      if (!currentList.includes(key)) {
        currentList.push(key);
        await this.prisma.systemSetting.upsert({
          where: { key: delKey },
          create: {
            key: delKey,
            value: currentList,
            description: `Deleted bot screens for store ${storeId}`,
          },
          update: { value: currentList },
        });
      }
    }

    return { success: true, key };
  }
}
