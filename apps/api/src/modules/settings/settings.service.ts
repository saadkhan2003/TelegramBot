import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllSettings() {
    const settings = await this.prisma.systemSetting.findMany({
      orderBy: { key: 'asc' },
    });
    // Filter sensitive fields
    return settings.map((s) => ({
      ...s,
      value: s.isSensitive ? '••••••••' : s.value,
    }));
  }

  async updateSetting(key: string, value: any, adminId: string) {
    const existing = await this.prisma.systemSetting.findUnique({ where: { key } });

    const updated = await this.prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    // Record audit log
    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: 'UPDATE_SYSTEM_SETTING',
        resourceType: 'system_settings',
        resourceId: key,
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
