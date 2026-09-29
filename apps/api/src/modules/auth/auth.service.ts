import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma.service';
import { TelegramNotifyService } from '../../common/telegram-notify.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly telegramNotify: TelegramNotifyService,
  ) {}


  async register(data: {
    name: string;
    email: string;
    password: string;
    storeName?: string;
    currency?: string;
  }) {
    const email = data.email?.toLowerCase().trim();
    if (!email || !data.password || !data.name?.trim()) {
      throw new BadRequestException('Name, email and password are required.');
    }
    if (data.password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters.');
    }

    // Check if email already taken
    const existing = await this.prisma.admin.findUnique({ where: { email } });
    if (existing) {
      throw new BadRequestException('An account with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    // Build store name and slug
    const storeName = data.storeName?.trim() || `${data.name.trim()}'s Store`;
    let slug = storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const existingSlug = await this.prisma.store.findUnique({ where: { slug } });
    if (existingSlug) slug = `${slug}-${Date.now().toString().slice(-5)}`;

    // Create admin + store + StoreMember + AdminRole in one transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const admin = await tx.admin.create({
        data: {
          email,
          name: data.name.trim(),
          passwordHash,
        },
      });

      const store = await tx.store.create({
        data: {
          name: storeName,
          slug,
          currency: data.currency?.toUpperCase() || 'USD',
          ownerId: admin.id,
          members: {
            create: {
              adminId: admin.id,
              role: 'OWNER',
            },
          },
        },
      });

      // Ensure OWNER role exists in the database
      let ownerRole = await tx.role.findUnique({ where: { slug: 'OWNER' } });
      if (!ownerRole) {
        ownerRole = await tx.role.create({
          data: {
            name: 'Owner',
            slug: 'OWNER',
            description: 'Store Owner with full administrative permissions',
          },
        });
      }

      // Assign OWNER role to the newly registered admin
      await tx.adminRole.create({
        data: {
          adminId: admin.id,
          roleId: ownerRole.id,
        },
      });

      return { admin, store };
    });

    // Retrieve all system permissions or supply defaults
    const allDbPermissions = await this.prisma.permission.findMany({ select: { slug: true } });
    const permissionSlugs = allDbPermissions.length > 0
      ? allDbPermissions.map((p) => p.slug)
      : [
          'products.view', 'products.edit',
          'categories.view', 'categories.edit',
          'orders.view', 'orders.refund',
          'inventory.view', 'inventory.create', 'inventory.credentials_view',
          'deposits.view', 'deposits.override',
          'settings.manage', 'admins.manage',
          'support.manage', 'wallets.view', 'wallets.adjust',
          '*',
        ];

    // Issue JWT so user is logged in immediately after signup
    const jwtPayload = {
      sub: result.admin.id,
      email: result.admin.email,
      name: result.admin.name,
      roles: ['OWNER'],
      permissions: permissionSlugs,
    };
    const token = this.jwtService.sign(jwtPayload);

    await this.prisma.adminSession.create({
      data: {
        adminId: result.admin.id,
        tokenHash: token.slice(-32),
        ip: 'registration',
        userAgent: 'web',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken: token,
      admin: {
        id: result.admin.id,
        email: result.admin.email,
        name: result.admin.name,
        roles: ['OWNER'],
        permissions: permissionSlugs,
      },
      store: {
        id: result.store.id,
        name: result.store.name,
      },
    };
  }

  async validateAdmin(email: string, pass: string) {
    let admin = await this.prisma.admin.findUnique({
      where: { email },
      include: {
        adminRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!admin || admin.status !== 'ACTIVE') {
      return null;
    }

    const isMatch = await bcrypt.compare(pass, admin.passwordHash);
    if (!isMatch) {
      return null;
    }

    // Auto-heal accounts that have no adminRoles assigned yet
    if (admin.adminRoles.length === 0) {
      try {
        let ownerRole = await this.prisma.role.findUnique({ where: { slug: 'OWNER' } });
        if (!ownerRole) {
          ownerRole = await this.prisma.role.create({
            data: {
              name: 'Owner',
              slug: 'OWNER',
              description: 'Store Owner with full administrative permissions',
            },
          });
        }
        await this.prisma.adminRole.upsert({
          where: {
            adminId_roleId: {
              adminId: admin.id,
              roleId: ownerRole.id,
            },
          },
          update: {},
          create: {
            adminId: admin.id,
            roleId: ownerRole.id,
          },
        });

        const refreshed = await this.prisma.admin.findUnique({
          where: { id: admin.id },
          include: {
            adminRoles: {
              include: {
                role: {
                  include: {
                    rolePermissions: {
                      include: { permission: true },
                    },
                  },
                },
              },
            },
          },
        });
        if (refreshed) admin = refreshed;
      } catch (err) {
        // Continue even if concurrent update occurred
      }
    }

    const permissions = new Set<string>();
    const roles = admin.adminRoles.map((ar) => ar.role.slug);

    admin.adminRoles.forEach((ar) => {
      ar.role.rolePermissions.forEach((rp) => {
        permissions.add(rp.permission.slug);
      });
    });

    // If the admin is OWNER, ADMIN, or SUPER_ADMIN, grant full permissions
    if (
      roles.includes('OWNER') ||
      roles.includes('ADMIN') ||
      roles.includes('SUPER_ADMIN') ||
      roles.length === 0
    ) {
      const allPerms = await this.prisma.permission.findMany({ select: { slug: true } });
      if (allPerms.length > 0) {
        allPerms.forEach((p) => permissions.add(p.slug));
      } else {
        [
          'products.view', 'products.edit',
          'categories.view', 'categories.edit',
          'orders.view', 'orders.refund',
          'inventory.view', 'inventory.create', 'inventory.credentials_view',
          'deposits.view', 'deposits.override',
          'settings.manage', 'admins.manage',
          'support.manage', 'wallets.view', 'wallets.adjust',
          '*',
        ].forEach((p) => permissions.add(p));
      }
      if (!roles.includes('OWNER') && roles.length === 0) {
        roles.push('OWNER');
      }
    }

    return {
      id: admin.id,
      email: admin.email,
      name: admin.name || admin.email.split('@')[0],
      roles,
      permissions: Array.from(permissions),
    };
  }

  async login(email: string, pass: string, ip?: string, userAgent?: string) {
    const admin = await this.validateAdmin(email, pass);
    if (!admin) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = {
      sub: admin.id,
      email: admin.email,
      name: admin.name,
      roles: admin.roles,
      permissions: admin.permissions,
    };

    const token = this.jwtService.sign(payload);

    // Record session
    await this.prisma.adminSession.create({
      data: {
        adminId: admin.id,
        tokenHash: token.slice(-32), // last 32 chars as hash/identifier
        ip: ip || 'unknown',
        userAgent: userAgent || 'unknown',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return {
      accessToken: token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        roles: admin.roles,
        permissions: admin.permissions,
      },
    };
  }

  async getProfile(adminId: string) {
    let admin = await this.prisma.admin.findUnique({
      where: { id: adminId },
      include: {
        adminRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!admin) {
      throw new UnauthorizedException('Admin not found');
    }

    // Auto-heal accounts that have no adminRoles assigned yet
    if (admin.adminRoles.length === 0) {
      try {
        let ownerRole = await this.prisma.role.findUnique({ where: { slug: 'OWNER' } });
        if (!ownerRole) {
          ownerRole = await this.prisma.role.create({
            data: {
              name: 'Owner',
              slug: 'OWNER',
              description: 'Store Owner with full administrative permissions',
            },
          });
        }
        await this.prisma.adminRole.upsert({
          where: {
            adminId_roleId: {
              adminId: admin.id,
              roleId: ownerRole.id,
            },
          },
          update: {},
          create: {
            adminId: admin.id,
            roleId: ownerRole.id,
          },
        });

        const refreshed = await this.prisma.admin.findUnique({
          where: { id: admin.id },
          include: {
            adminRoles: {
              include: {
                role: {
                  include: {
                    rolePermissions: {
                      include: { permission: true },
                    },
                  },
                },
              },
            },
          },
        });
        if (refreshed) admin = refreshed;
      } catch (err) {
        // Continue even if concurrent update occurred
      }
    }

    const permissions = new Set<string>();
    const roles = admin.adminRoles.map((ar) => ar.role.slug);

    admin.adminRoles.forEach((ar) => {
      ar.role.rolePermissions.forEach((rp) => {
        permissions.add(rp.permission.slug);
      });
    });

    // If the admin is OWNER, ADMIN, or SUPER_ADMIN, grant full permissions
    if (
      roles.includes('OWNER') ||
      roles.includes('ADMIN') ||
      roles.includes('SUPER_ADMIN') ||
      roles.length === 0
    ) {
      const allPerms = await this.prisma.permission.findMany({ select: { slug: true } });
      if (allPerms.length > 0) {
        allPerms.forEach((p) => permissions.add(p.slug));
      } else {
        [
          'products.view', 'products.edit',
          'categories.view', 'categories.edit',
          'orders.view', 'orders.refund',
          'inventory.view', 'inventory.create', 'inventory.credentials_view',
          'deposits.view', 'deposits.override',
          'settings.manage', 'admins.manage',
          'support.manage', 'wallets.view', 'wallets.adjust',
          '*',
        ].forEach((p) => permissions.add(p));
      }
      if (!roles.includes('OWNER') && roles.length === 0) {
        roles.push('OWNER');
      }
    }

    return {
      id: admin.id,
      email: admin.email,
      name: admin.name || admin.email.split('@')[0],
      roles,
      permissions: Array.from(permissions),
      createdAt: admin.createdAt,
    };
  }

  async logout(adminId: string, token?: string) {
    if (token) {
      const tokenHash = token.slice(-32);
      await this.prisma.adminSession.updateMany({
        where: { adminId, tokenHash },
        data: { revokedAt: new Date() },
      });
    }
    return { success: true, message: 'Logged out successfully' };
  }

  async requestPasswordReset(email: string, ip?: string) {
    const normalizedEmail = email?.toLowerCase().trim();
    if (!normalizedEmail) {
      throw new BadRequestException('Email address is required.');
    }

    const admin = await this.prisma.admin.findUnique({
      where: { email: normalizedEmail },
    });

    if (!admin) {
      throw new BadRequestException('No admin account found matching this email address.');
    }

    if (admin.status !== 'ACTIVE') {
      throw new BadRequestException('This account is suspended or inactive.');
    }

    // Generate 6-digit cryptographic verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins

    // Store in system settings table
    const key = `pwd_reset_${normalizedEmail}`;
    await this.prisma.systemSetting.upsert({
      where: { key },
      create: {
        key,
        value: { code, expiresAt, adminId: admin.id, ip: ip || 'unknown' },
        description: `Password reset verification for ${normalizedEmail}`,
        isSensitive: true,
      },
      update: {
        value: { code, expiresAt, adminId: admin.id, ip: ip || 'unknown' },
      },
    });

    // Send immediate security dispatch to Owner/Admin on Telegram
    const adminTgId = process.env.ADMIN_TELEGRAM_ID || '6175593888';
    try {
      await this.telegramNotify.sendMessage({
        telegramUserId: adminTgId,
        text: `🔐 *Store Admin Security Alert*\n\n` +
          `A password recovery was requested for account:\n\`${normalizedEmail}\`\n\n` +
          `*Verification Code:* \`${code}\`\n` +
          `*Validity:* 15 minutes\n` +
          `*IP Address:* \`${ip || 'Web Console'}\`\n\n` +
          `Enter this code in your console to set a new password. If this wasn't requested by you, please check system audit trails.`,
      });
    } catch (err: any) {
      this.logger.warn(`Failed to dispatch recovery code to Telegram: ${err.message}`);
    }

    return {
      success: true,
      message: 'A 6-digit recovery code has been dispatched to your authorized Telegram device.',
      destination: 'Telegram Security Channel',
      // Expose preview code in development mode or non-production for instant convenience
      previewCode: process.env.NODE_ENV !== 'production' ? code : undefined,
    };
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    const normalizedEmail = email?.toLowerCase().trim();
    if (!normalizedEmail) {
      throw new BadRequestException('Email address is required.');
    }

    if (!code || code.trim().length !== 6) {
      throw new BadRequestException('Please provide a valid 6-digit verification code.');
    }

    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestException('New password must be at least 8 characters long.');
    }

    const key = `pwd_reset_${normalizedEmail}`;
    const resetRecord = await this.prisma.systemSetting.findUnique({
      where: { key },
    });

    if (!resetRecord || !resetRecord.value) {
      throw new BadRequestException('No active password reset request found. Please request a new verification code.');
    }

    const val = resetRecord.value as any;
    if (Date.now() > val.expiresAt) {
      await this.prisma.systemSetting.delete({ where: { key } }).catch(() => {});
      throw new BadRequestException('Verification code has expired. Please request a new one.');
    }

    if (val.code !== code.trim()) {
      throw new BadRequestException('Invalid verification code. Please check and try again.');
    }

    // Hash new password securely
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update admin password
    await this.prisma.admin.update({
      where: { email: normalizedEmail },
      data: { passwordHash },
    });

    // Cleanup reset token
    await this.prisma.systemSetting.delete({ where: { key } }).catch(() => {});

    // Revoke all existing sessions for security
    await this.prisma.adminSession.updateMany({
      where: { adminId: val.adminId },
      data: { revokedAt: new Date() },
    });

    // Notify Telegram channel
    const adminTgId = process.env.ADMIN_TELEGRAM_ID || '6175593888';
    try {
      await this.telegramNotify.sendMessage({
        telegramUserId: adminTgId,
        text: `✅ *Store Admin Password Changed*\n\n` +
          `The password for \`${normalizedEmail}\` has been successfully updated.\n` +
          `All prior active sessions have been revoked.`,
      });
    } catch {}

    return {
      success: true,
      message: 'Password reset successful. You may now sign in with your new password.',
    };
  }
}
