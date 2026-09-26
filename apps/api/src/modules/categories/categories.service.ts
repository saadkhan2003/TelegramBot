import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CategoryStatus } from '@telegram-store/shared';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(includeInactive = false) {
    return this.prisma.category.findMany({
      where: includeInactive ? undefined : { status: CategoryStatus.ACTIVE },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        products: true,
      },
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async create(data: {
    name: string;
    emoji?: string;
    description?: string;
    status?: CategoryStatus;
    sortOrder?: number;
    parentId?: string;
  }) {
    return this.prisma.category.create({
      data: {
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
  }>) {
    await this.findOne(id);
    return this.prisma.category.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.category.update({
      where: { id },
      data: { status: CategoryStatus.DISABLED },
    });
  }
}
