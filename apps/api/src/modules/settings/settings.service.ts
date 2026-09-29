import { Injectable } from '@nestjs/common';
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
  }) {
    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params?.resourceType) where.resourceType = params.resourceType;

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
    const prefix = storeId ? `bot_screen_${storeId}_` : 'bot_screen_';
    const records = await this.prisma.systemSetting.findMany({
      where: { key: { startsWith: prefix } },
    });
    return records.reduce((acc: Record<string, any>, r) => {
      acc[r.key.replace(prefix, '')] = r.value;
      return acc;
    }, {});
  }

  async saveBotScreen(key: string, data: { components: any[]; meta?: any }, storeId?: string) {
    const settingKey = storeId ? `bot_screen_${storeId}_${key}` : `bot_screen_${key}`;
    const value = {
      components: data.components,
      meta: data.meta || null,
    };
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
    const settingKey = storeId ? `bot_screen_${storeId}_${key}` : `bot_screen_${key}`;
    await this.prisma.systemSetting.deleteMany({
      where: { key: settingKey },
    });
    return { success: true, key };
  }
}
