import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { AdminAuthGuard } from '../auth/auth.guard';
import * as bcrypt from 'bcrypt';

@Controller('admin/team')
@UseGuards(AdminAuthGuard)
export class TeamController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getTeamMembers(@Req() req: any) {
    const storeId = req.headers['x-store-id'] as string;
    const currentAdminId = req.admin?.sub;

    let store = null;
    if (storeId) {
      store = await this.prisma.store.findFirst({
        where: {
          id: storeId,
          OR: [
            { ownerId: currentAdminId },
            { members: { some: { adminId: currentAdminId } } },
          ],
        },
        include: {
          owner: {
            include: {
              adminRoles: { include: { role: true } },
              _count: { select: { sessions: true, auditLogs: true } },
            },
          },
          members: {
            include: {
              admin: {
                include: {
                  adminRoles: { include: { role: true } },
                  _count: { select: { sessions: true, auditLogs: true } },
                },
              },
            },
          },
        },
      });
    }

    if (!store) {
      // Fallback: return only the current logged-in admin, never all system admins
      if (!currentAdminId) return [];
      const self = await this.prisma.admin.findUnique({
        where: { id: currentAdminId },
        include: {
          adminRoles: { include: { role: true } },
          _count: { select: { sessions: true, auditLogs: true } },
        },
      });
      if (!self) return [];
      return [
        {
          id: self.id,
          email: self.email,
          name: self.name || self.email.split('@')[0],
          status: self.status,
          roles: self.adminRoles.map((ar) => ({
            id: ar.role.id,
            name: ar.role.name,
            slug: ar.role.slug,
          })),
          createdAt: self.createdAt,
          updatedAt: self.updatedAt,
          sessionCount: self._count.sessions,
        },
      ];
    }

    // Combine store owner and members without duplicates
    const memberMap = new Map<string, any>();

    // 1. Store Owner
    const owner = store.owner;
    if (owner) {
      memberMap.set(owner.id, {
        id: owner.id,
        email: owner.email,
        name: owner.name || owner.email.split('@')[0],
        status: owner.status,
        roles: [{ id: 'role-owner', name: 'Owner', slug: 'OWNER' }],
        createdAt: owner.createdAt,
        updatedAt: owner.updatedAt,
        sessionCount: owner._count?.sessions || 0,
      });
    }

    // 2. Store Members
    for (const sm of store.members) {
      const a = sm.admin;
      if (!a) continue;
      const roleSlug = sm.role || 'ADMIN';
      const roleName =
        roleSlug === 'OWNER'
          ? 'Owner'
          : roleSlug === 'MANAGER'
          ? 'Manager'
          : roleSlug === 'SUPPORT_AGENT'
          ? 'Support Agent'
          : 'Admin';

      memberMap.set(a.id, {
        id: a.id,
        email: a.email,
        name: a.name || a.email.split('@')[0],
        status: a.status,
        roles: [{ id: `role-${roleSlug.toLowerCase()}`, name: roleName, slug: roleSlug }],
        createdAt: sm.createdAt || a.createdAt,
        updatedAt: a.updatedAt,
        sessionCount: a._count?.sessions || 0,
      });
    }

    return Array.from(memberMap.values());
  }

  @Get('roles')
  async getRoles() {
    return this.prisma.role.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  @Post()
  async createTeamMember(
    @Body()
    body: {
      email: string;
      password: string;
      name?: string;
      roleSlug?: string;
    },
    @Req() req: any,
  ) {
    const email = body.email?.trim().toLowerCase();
    if (!email || !body.password) {
      throw new BadRequestException('Email and password are required');
    }

    if (body.password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters long');
    }

    const storeId = req.headers['x-store-id'] as string;
    const currentAdminId = req.admin?.sub;

    let store = null;
    if (storeId) {
      store = await this.prisma.store.findFirst({
        where: {
          id: storeId,
          OR: [
            { ownerId: currentAdminId },
            { members: { some: { adminId: currentAdminId } } },
          ],
        },
      });
    }

    const targetRoleSlug = body.roleSlug || 'ADMIN';
    const role = await this.prisma.role.findUnique({
      where: { slug: targetRoleSlug },
    });
    if (!role) {
      throw new NotFoundException(`Role '${targetRoleSlug}' not found`);
    }

    let admin = await this.prisma.admin.findUnique({
      where: { email },
      include: { adminRoles: { include: { role: true } } },
    });

    if (!admin) {
      const hashedPassword = await bcrypt.hash(body.password, 10);
      admin = await this.prisma.admin.create({
        data: {
          email,
          name: body.name?.trim() || email.split('@')[0],
          passwordHash: hashedPassword,
          status: 'ACTIVE',
          adminRoles: {
            create: {
              roleId: role.id,
            },
          },
        },
        include: {
          adminRoles: {
            include: { role: true },
          },
        },
      });
    }

    if (store) {
      const existingMember = await this.prisma.storeMember.findUnique({
        where: {
          storeId_adminId: {
            storeId: store.id,
            adminId: admin.id,
          },
        },
      });
      if (existingMember) {
        throw new BadRequestException('This user is already a member of this store team');
      }
      await this.prisma.storeMember.create({
        data: {
          storeId: store.id,
          adminId: admin.id,
          role: targetRoleSlug,
        },
      });
    }

    return {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      status: admin.status,
      roles: [{ id: role.id, name: role.name, slug: targetRoleSlug }],
      createdAt: admin.createdAt,
    };
  }

  @Patch(':id')
  async updateTeamMember(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      status?: 'ACTIVE' | 'SUSPENDED';
      roleSlug?: string;
      password?: string;
    },
    @Req() req: any,
  ) {
    const admin = await this.prisma.admin.findUnique({
      where: { id },
      include: { adminRoles: { include: { role: true } } },
    });
    if (!admin) throw new NotFoundException('Team member not found');

    // Prevent suspending self
    if (req.admin?.sub === id && body.status === 'SUSPENDED') {
      throw new ForbiddenException('You cannot suspend your own account');
    }

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.status !== undefined) updateData.status = body.status;
    if (body.password) {
      if (body.password.length < 6) {
        throw new BadRequestException('Password must be at least 6 characters');
      }
      updateData.passwordHash = await bcrypt.hash(body.password, 10);
    }

    const storeId = req.headers['x-store-id'] as string;
    // Role update
    if (body.roleSlug) {
      const role = await this.prisma.role.findUnique({
        where: { slug: body.roleSlug },
      });
      if (!role) throw new NotFoundException(`Role '${body.roleSlug}' not found`);

      await this.prisma.adminRole.deleteMany({
        where: { adminId: id },
      });

      await this.prisma.adminRole.create({
        data: {
          adminId: id,
          roleId: role.id,
        },
      });

      if (storeId) {
        await this.prisma.storeMember.updateMany({
          where: { storeId, adminId: id },
          data: { role: body.roleSlug },
        });
      }
    }

    const updated = await this.prisma.admin.update({
      where: { id },
      data: updateData,
      include: {
        adminRoles: {
          include: { role: true },
        },
      },
    });

    return {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      status: updated.status,
      roles: updated.adminRoles.map((ar) => ({
        id: ar.role.id,
        name: ar.role.name,
        slug: ar.role.slug,
      })),
      updatedAt: updated.updatedAt,
    };
  }

  @Delete(':id')
  async deleteTeamMember(@Param('id') id: string, @Req() req: any) {
    if (req.admin?.sub === id) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    const storeId = req.headers['x-store-id'] as string;
    const currentAdminId = req.admin?.sub;

    if (storeId) {
      const store = await this.prisma.store.findFirst({
        where: {
          id: storeId,
          OR: [
            { ownerId: currentAdminId },
            { members: { some: { adminId: currentAdminId } } },
          ],
        },
      });

      if (store) {
        if (store.ownerId === id) {
          throw new ForbiddenException('The primary Store Owner cannot be removed from the store team');
        }

        await this.prisma.storeMember.deleteMany({
          where: {
            storeId: store.id,
            adminId: id,
          },
        });
        return { success: true, message: 'Team member removed from this store' };
      }
    }

    const admin = await this.prisma.admin.findUnique({
      where: { id },
      include: { adminRoles: { include: { role: true } } },
    });
    if (!admin) throw new NotFoundException('Team member not found');

    const isOwner = admin.adminRoles.some((ar) => ar.role.slug === 'OWNER');
    if (isOwner) {
      throw new ForbiddenException('The primary Store Owner account cannot be deleted');
    }

    await this.prisma.admin.delete({
      where: { id },
    });

    return { success: true, message: 'Team member removed' };
  }
}
