import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { InventoryStatus } from '@telegram-store/shared';
import { encryptPayload, decryptPayload, parseBulkInventory } from '@telegram-store/inventory';

@Injectable()
export class InventoryService {
  private readonly encryptionKey: string;

  constructor(private readonly prisma: PrismaService) {
    this.encryptionKey =
      process.env.ENCRYPTION_KEY ||
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  }

  async findAll(params?: {
    productId?: string;
    status?: InventoryStatus;
    page?: number;
    limit?: number;
  }) {
    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params?.productId) where.productId = params.productId;
    if (params?.status) where.status = params.status;

    const [items, total] = await Promise.all([
      this.prisma.inventoryItem.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { id: true, name: true, sku: true } },
          supplier: { select: { id: true, name: true } },
        },
      }),
      this.prisma.inventoryItem.count({ where }),
    ]);

    // Mask payload by default unless explicitly inspected
    const sanitized = items.map((item) => ({
      ...item,
      encryptedPayload: '••••••••[ENCRYPTED]',
    }));

    return {
      data: sanitized,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async revealCredentials(id: string) {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id },
      include: { product: true },
    });
    if (!item) throw new NotFoundException('Inventory item not found');

    const decrypted = decryptPayload(item.encryptedPayload, this.encryptionKey);
    return {
      id: item.id,
      productId: item.productId,
      status: item.status,
      credentials: decrypted,
    };
  }

  validateImport(rawContent: string, delimiter = '|') {
    return parseBulkInventory(rawContent, delimiter);
  }

  async importBulk(data: {
    productId: string;
    rawContent: string;
    delimiter?: string;
    supplierId?: string;
    purchaseCost?: number;
    purchaseReference?: string;
  }) {
    const product = await this.prisma.product.findUnique({
      where: { id: data.productId },
    });
    if (!product) throw new NotFoundException('Product not found');

    const parseResult = parseBulkInventory(data.rawContent, data.delimiter || '|');
    const validItems = parseResult.items.filter((item) => item.isValid);

    if (validItems.length === 0) {
      throw new BadRequestException('No valid inventory items found in import payload');
    }

    const createdRecords = [];
    for (const item of validItems) {
      const encrypted = encryptPayload(item.payload, this.encryptionKey);
      const record = await this.prisma.inventoryItem.create({
        data: {
          productId: data.productId,
          supplierId: data.supplierId,
          encryptedPayload: encrypted,
          purchaseCost: data.purchaseCost,
          purchaseReference: data.purchaseReference,
          status: InventoryStatus.AVAILABLE,
        },
      });
      createdRecords.push(record);
    }

    return {
      totalUploaded: parseResult.total,
      importedCount: createdRecords.length,
      duplicateCount: parseResult.duplicateCount,
      invalidCount: parseResult.invalidCount,
    };
  }

  async updateStatus(id: string, status: InventoryStatus) {
    const item = await this.prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Inventory item not found');

    return this.prisma.inventoryItem.update({
      where: { id },
      data: { status },
    });
  }

  async updateItem(
    id: string,
    data: {
      purchaseCost?: number | null;
      status?: InventoryStatus;
      purchaseReference?: string | null;
    },
  ) {
    const item = await this.prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Inventory item not found');

    return this.prisma.inventoryItem.update({
      where: { id },
      data: {
        ...(data.purchaseCost !== undefined ? { purchaseCost: data.purchaseCost } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.purchaseReference !== undefined ? { purchaseReference: data.purchaseReference } : {}),
      },
      include: { product: true },
    });
  }
}
