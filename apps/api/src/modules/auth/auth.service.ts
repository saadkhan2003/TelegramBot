import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validateAdmin(email: string, pass: string) {
    const admin = await this.prisma.admin.findUnique({
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

    const permissions = new Set<string>();
    admin.adminRoles.forEach((ar) => {
      ar.role.rolePermissions.forEach((rp) => {
        permissions.add(rp.permission.slug);
      });
    });

    return {
      id: admin.id,
      email: admin.email,
      roles: admin.adminRoles.map((ar) => ar.role.slug),
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
        roles: admin.roles,
        permissions: admin.permissions,
      },
    };
  }

  async getProfile(adminId: string) {
    const admin = await this.prisma.admin.findUnique({
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

    const permissions = new Set<string>();
    admin.adminRoles.forEach((ar) => {
      ar.role.rolePermissions.forEach((rp) => {
        permissions.add(rp.permission.slug);
      });
    });

    return {
      id: admin.id,
      email: admin.email,
      roles: admin.adminRoles.map((ar) => ar.role.slug),
      permissions: Array.from(permissions),
      createdAt: admin.createdAt,
    };
  }
}
