import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { DeliverySpeed, DeliveryType, InventoryStatus, ProductStatus } from '@telegram-store/shared';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params?: {
    storeId?: string;
    categoryId?: string;
    status?: ProductStatus;
    search?: string;
    includeInactive?: boolean;
    page?: number;
    limit?: number;
  }) {
    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params?.storeId) where.storeId = params.storeId;
    if (params?.categoryId) where.categoryId = params.categoryId;
    if (params?.status) {
      where.status = params.status;
    } else if (!params?.includeInactive) {
      where.status = ProductStatus.ACTIVE;
    }

    if (params?.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { sku: { contains: params.search, mode: 'insensitive' } },
        { shortDescription: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        include: {
          category: true,
          _count: {
            select: {
              inventoryItems: {
                where: { status: InventoryStatus.AVAILABLE },
              },
            },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    const formatted = products.map((p) => ({
      ...p,
      availableStock: p.trackInventory ? p._count.inventoryItems : 9999,
      isLowStock:
        p.trackInventory && p.lowStockThreshold
          ? p._count.inventoryItems <= p.lowStockThreshold
          : false,
    }));

    return {
      data: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, storeId?: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        _count: {
          select: {
            inventoryItems: {
              where: { status: InventoryStatus.AVAILABLE },
            },
          },
        },
      },
    });

    if (!product) throw new NotFoundException('Product not found');
    if (storeId && product.storeId && product.storeId !== storeId) {
      throw new NotFoundException('Product not found');
    }

    return {
      ...product,
      availableStock: product.trackInventory ? product._count.inventoryItems : 9999,
    };
  }

  async create(data: {
    storeId?: string;
    categoryId: string;
    sku: string;
    name: string;
    slug?: string;
    shortDescription?: string;
    fullDescription?: string;
    normalPrice: number;
    salePrice?: number;
    deliveryType: DeliveryType;
    deliverySpeed?: DeliverySpeed;
    warrantyEnabled?: boolean;
    warrantyDays?: number;
    minQuantity?: number;
    maxQuantity?: number;
    allowCustomQuantity?: boolean;
    trackInventory?: boolean;
    lowStockThreshold?: number;
    status?: ProductStatus;
    featured?: boolean;
    sortOrder?: number;
  }) {
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return this.prisma.product.create({
      data: {
        ...data,
        slug,
      },
    });
  }

  async update(id: string, data: any, storeId?: string) {
    await this.findOne(id, storeId);
    return this.prisma.product.update({
      where: { id },
      data,
    });
  }

  async archive(id: string, storeId?: string) {
    await this.findOne(id, storeId);
    return this.prisma.product.update({
      where: { id },
      data: { status: ProductStatus.ARCHIVED },
    });
  }
}
