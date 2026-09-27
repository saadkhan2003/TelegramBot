import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CategoryStatus } from '@telegram-store/shared';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(includeInactive = false, storeId?: string) {
    const where: any = includeInactive ? {} : { status: CategoryStatus.ACTIVE };
    if (storeId) where.storeId = storeId;
    return this.prisma.category.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  }

  async findOne(id: string, storeId?: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        products: true,
      },
    });
    if (!category) throw new NotFoundException('Category not found');
    if (storeId && category.storeId && category.storeId !== storeId) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async create(data: {
    storeId?: string;
    name: string;
    emoji?: string;
    description?: string;
    status?: CategoryStatus;
    sortOrder?: number;
    parentId?: string;
  }) {
    return this.prisma.category.create({
      data: {
        storeId: data.storeId,
        name: data.name,
        emoji: data.emoji,
        description: data.description,
        status: data.status || CategoryStatus.ACTIVE,
        sortOrder: data.sortOrder ?? 0,
        parentId: data.parentId,
      },
    });
  }

  async update(id: string, data: Partial<{
    name: string;
    emoji: string;
    description: string;
    status: CategoryStatus;
    sortOrder: number;
    parentId: string;
  }>, storeId?: string) {
    await this.findOne(id, storeId);
    return this.prisma.category.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, storeId?: string) {
    await this.findOne(id, storeId);
    return this.prisma.category.update({
      where: { id },
      data: { status: CategoryStatus.DISABLED },
    });
  }
}
