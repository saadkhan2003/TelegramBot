import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { WalletsService } from '../wallets/wallets.service';
import {
  DeliverySpeed,
  DeliveryStatus,
  DeliveryType,
  generateOrderNumber,
  InventoryStatus,
  OrderStatus,
  RefundType,
  TxDirection,
  WalletTxType,
} from '@telegram-store/shared';
import { Prisma } from '@telegram-store/database';
import { decryptPayload, encryptPayload } from '@telegram-store/inventory';
import { TelegramNotifyService } from '../../common/telegram-notify.service';

@Injectable()
export class OrdersService {
  private readonly encryptionKey: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletsService: WalletsService,
    private readonly telegramNotify: TelegramNotifyService,
  ) {
    this.encryptionKey =
      process.env.ENCRYPTION_KEY ||
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  }

  async findAll(params?: {
    storeId?: string;
    userId?: string;
    status?: OrderStatus;
    page?: number;
    limit?: number;
  }) {
    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params?.storeId) where.storeId = params.storeId;
    if (params?.userId) where.userId = params.userId;
    if (params?.status) where.status = params.status;

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, telegramUserId: true, telegramUsername: true, firstName: true } },
          items: {
            include: {
              product: true,
              deliveries: true,
            },
          },
          refunds: true,
        },
      }),
      this.prisma.order.count({ where }),
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

  async findOne(id: string, storeId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: true,
        items: {
          include: {
            product: true,
            deliveries: true,
          },
        },
        refunds: true,
        warrantyClaims: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (storeId && order.storeId && order.storeId !== storeId) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  /**
   * Atomic Checkout Engine (PRD Sections 41-47)
   */
  async checkout(params: {
    userId: string;
    productId: string;
    quantity: number;
  }) {
    if (params.quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    return this.prisma.$transaction(
      async (tx) => {
        // 1. Fetch and validate product
        const product = await tx.product.findUnique({
          where: { id: params.productId },
        });

        if (!product || product.status !== 'ACTIVE') {
          throw new BadRequestException('Product is not available for purchase');
        }

        if (params.quantity < product.minQuantity) {
          throw new BadRequestException(`Minimum quantity is ${product.minQuantity}`);
        }
        if (params.quantity > product.maxQuantity) {
          throw new BadRequestException(`Maximum quantity is ${product.maxQuantity}`);
        }

        const unitPrice = product.salePrice ?? product.normalPrice;
        const totalAmount = new Prisma.Decimal(unitPrice).mul(params.quantity);

        const isManualFulfilment =
          product.deliverySpeed === DeliverySpeed.MANUAL ||
          product.deliveryType === DeliveryType.MANUAL_DELIVERY ||
          !product.trackInventory;

        // 2. Lock required inventory rows if instant & track inventory
        let availableInventory: { id: string; encrypted_payload: string }[] = [];
        if (product.trackInventory && !isManualFulfilment) {
          availableInventory = await tx.$queryRaw<
            { id: string; encrypted_payload: string }[]
          >`
            SELECT id, encrypted_payload 
            FROM inventory_items 
            WHERE product_id = ${product.id}::uuid AND status = 'AVAILABLE'
            LIMIT ${params.quantity}
            FOR UPDATE SKIP LOCKED
          `;

          if (availableInventory.length < params.quantity) {
            throw new BadRequestException(
              `Insufficient stock. Requested: ${params.quantity}, Available: ${availableInventory.length}`,
            );
          }
        }

        // 3. Lock user wallet & execute debit
        const wallet = await this.walletsService.getWalletByUserId(params.userId);

        const orderNumber = generateOrderNumber();

        const { transaction: debitTx } = await this.walletsService.executeLedgerTransaction(
          tx,
          {
            walletId: wallet.id,
            type: WalletTxType.ORDER_PURCHASE,
            direction: TxDirection.DEBIT,
            amount: totalAmount,
            referenceType: 'ORDER',
            referenceId: orderNumber,
            description: `Purchase: ${params.quantity}x ${product.name} (#${orderNumber})`,
          },
        );

        // 4. Create Order and OrderItem
        const order = await tx.order.create({
          data: {
            orderNumber,
            userId: params.userId,
            subtotal: totalAmount,
            discount: 0,
            total: totalAmount,
            status: isManualFulfilment ? OrderStatus.PROCESSING : OrderStatus.FULFILLED,
            walletTransactionId: debitTx.id,
            completedAt: isManualFulfilment ? null : new Date(),
          },
        });

        const orderItem = await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: product.id,
            productNameSnapshot: product.name,
            unitPrice,
            quantity: params.quantity,
            total: totalAmount,
            warrantyDaysSnapshot: product.warrantyDays,
            status: isManualFulfilment ? 'PROCESSING' : 'COMPLETED',
          },
        });

        // 5. Mark Inventory as SOLD & Create Delivery records if instant
        const deliveries = [];
        if (availableInventory.length > 0) {
          for (const item of availableInventory) {
            await tx.inventoryItem.update({
              where: { id: item.id },
              data: {
                status: InventoryStatus.SOLD,
                soldOrderItemId: orderItem.id,
                soldAt: new Date(),
              },
            });

            const delivery = await tx.delivery.create({
              data: {
                orderItemId: orderItem.id,
                inventoryItemId: item.id,
                encryptedDeliveryPayload: item.encrypted_payload,
                status: DeliveryStatus.DELIVERED,
                deliveredAt: new Date(),
              },
            });
            deliveries.push(delivery);
          }
        }

        // 6. Handle Referral Commission (PRD Section 55-58)
        const user = await tx.user.findUnique({
          where: { id: params.userId },
          include: { referralRecord: true },
        });

        if (user?.referredByUserId) {
          const referralSetting = await tx.systemSetting.findUnique({
            where: { key: 'referral_rate' },
          });
          const commissionRate = referralSetting ? Number(referralSetting.value) : 10.0;
          const commissionAmount = totalAmount.mul(commissionRate).div(100);

          if (commissionAmount.greaterThan(0)) {
            const referrerWallet = await this.walletsService.getWalletByUserId(
              user.referredByUserId,
            );

            const { transaction: commTx } = await this.walletsService.executeLedgerTransaction(
              tx,
              {
                walletId: referrerWallet.id,
                type: WalletTxType.REFERRAL_COMMISSION,
                direction: TxDirection.CREDIT,
                amount: commissionAmount,
                referenceType: 'REFERRAL_ORDER',
                referenceId: order.id,
                description: `Referral commission from order #${order.orderNumber}`,
              },
            );

            if (user.referralRecord) {
              await tx.referralCommission.create({
                data: {
                  referralId: user.referralRecord.id,
                  orderId: order.id,
                  walletTransactionId: commTx.id,
                  amount: commissionAmount,
                  ratePercentage: commissionRate,
                  status: 'CREDITED',
                  creditedAt: new Date(),
                },
              });
            }
          }
        }

        return {
          order,
          orderItem,
          deliveries,
          product,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }

  /**
   * Refund order and return balance to wallet
   */
  async processRefund(params: {
    orderId: string;
    amount?: number;
    reason: string;
    notes?: string;
    adminId: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: params.orderId },
        include: { items: true },
      });
      if (!order) throw new NotFoundException('Order not found');

      const refundAmount = params.amount ?? Number(order.total);
      const wallet = await this.walletsService.getWalletByUserId(order.userId);

      const { transaction: refundTx } = await this.walletsService.executeLedgerTransaction(
        tx,
        {
          walletId: wallet.id,
          type: WalletTxType.REFUND,
          direction: TxDirection.CREDIT,
          amount: refundAmount,
          referenceType: 'ORDER_REFUND',
          referenceId: order.id,
          description: `Refund for order #${order.orderNumber}: ${params.reason}`,
          createdByAdminId: params.adminId,
        },
      );

      const refund = await tx.refund.create({
        data: {
          orderId: order.id,
          walletTransactionId: refundTx.id,
          type: RefundType.WALLET_CREDIT,
          amount: refundAmount,
          reason: params.reason,
          notes: params.notes,
          createdByAdminId: params.adminId,
        },
      });

      await tx.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.REFUNDED },
      });

      return refund;
    });
  }

  /**
   * Admin manual fulfillment: Admin buys license/account from wholesaler, pastes it here, and delivers to customer
   */
  async fulfillManualOrder(params: {
    orderId: string;
    deliveryPayload: string;
    notes?: string;
    adminId: string;
  }) {
    const result = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: params.orderId },
        include: { items: { include: { product: true } }, user: true },
      });

      if (!order) throw new NotFoundException('Order not found');
      if (order.status !== OrderStatus.PROCESSING && order.status !== OrderStatus.PENDING) {
        throw new BadRequestException(`Order cannot be fulfilled in status ${order.status}`);
      }

      const encrypted = encryptPayload(params.deliveryPayload, this.encryptionKey);

      // Create delivery record for first order item
      const orderItem = order.items[0];
      if (orderItem) {
        await tx.delivery.create({
          data: {
            orderItemId: orderItem.id,
            encryptedDeliveryPayload: encrypted,
            deliveryMethod: 'ADMIN_MANUAL_DELIVERY',
            status: DeliveryStatus.DELIVERED,
            deliveredAt: new Date(),
          },
        });
      }

      const updated = await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.FULFILLED,
          completedAt: new Date(),
        },
        include: { user: true, items: true },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          adminId: params.adminId,
          action: 'MANUAL_ORDER_FULFILMENT',
          resourceType: 'orders',
          resourceId: order.id,
          afterData: { orderNumber: order.orderNumber, deliveredAt: new Date() },
        },
      });

      return {
        order: updated,
        customerTelegramId: order.user.telegramUserId.toString(),
        productName: orderItem?.productNameSnapshot,
        deliveredPayload: params.deliveryPayload,
      };
    });

    // Send instant Telegram notification to the customer with delivered keys
    try {
      const tgUserId = result.customerTelegramId;
      if (tgUserId) {
        await this.telegramNotify.sendMessage({
          telegramUserId: tgUserId,
          storeId: result.order?.storeId || undefined,
          text:
            `✅ *Order Fulfilled & Delivered!*\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `📦 *Order #:* \`#${result.order.orderNumber}\`\n` +
            `🛍 *Product:* *${result.productName || 'Digital License'}*\n\n` +
            `🔑 *Your Delivery / License Details:*\n` +
            `\`\`\`\n${result.deliveredPayload}\n\`\`\`\n\n` +
            `Thank you for shopping with us! If you need warranty or assistance, visit 💬 Support.`,
          replyMarkup: {
            inline_keyboard: [
              [{ text: '📦 View Order', callback_data: `order_detail_${result.order.id}` }],
              [{ text: '🏠 Main Menu', callback_data: 'nav_main' }],
            ],
          },
        });
      }
    } catch (err: any) {
      console.error('Failed to dispatch order fulfillment Telegram notification:', err.message);
    }

    return result;
  }
}
