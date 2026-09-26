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
import { AdminAuthGuard, RequirePermissions } from '../auth/auth.guard';
import * as bcrypt from 'bcrypt';

@Controller('admin/team')
@UseGuards(AdminAuthGuard)
export class TeamController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getTeamMembers() {
    const members = await this.prisma.admin.findMany({
      include: {
        adminRoles: {
          include: {
            role: true,
          },
        },
        _count: {
          select: {
            sessions: true,
            auditLogs: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return members.map((m) => ({
      id: m.id,
      email: m.email,
      name: m.name || m.email.split('@')[0],
      status: m.status,
      roles: m.adminRoles.map((ar) => ({
        id: ar.role.id,
        name: ar.role.name,
        slug: ar.role.slug,
      })),
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
      sessionCount: m._count.sessions,
    }));
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

    const existing = await this.prisma.admin.findUnique({
      where: { email },
    });
    if (existing) {
      throw new BadRequestException('An admin with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);
    const targetRoleSlug = body.roleSlug || 'ADMIN';

    const role = await this.prisma.role.findUnique({
      where: { slug: targetRoleSlug },
    });
    if (!role) {
      throw new NotFoundException(`Role '${targetRoleSlug}' not found`);
    }

    const newAdmin = await this.prisma.admin.create({
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

    return {
      id: newAdmin.id,
      email: newAdmin.email,
      name: newAdmin.name,
      status: newAdmin.status,
      roles: newAdmin.adminRoles.map((ar) => ({
        id: ar.role.id,
        name: ar.role.name,
        slug: ar.role.slug,
      })),
      createdAt: newAdmin.createdAt,
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
    if (req.admin.sub === id && body.status === 'SUSPENDED') {
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
    if (req.admin.sub === id) {
      throw new ForbiddenException('You cannot delete your own account');
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
