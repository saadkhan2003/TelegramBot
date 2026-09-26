import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { DepositStatus, InventoryStatus, OrderStatus, ProductStatus, TicketStatus, WarrantyStatus } from '@telegram-store/shared';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardMetrics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      todayOrders,
      totalOrders,
      todayDeposits,
      totalCustomers,
      newCustomersToday,
      activeProducts,
      availableStockCount,
      pendingDepositsCount,
      openTicketsCount,
      openWarrantyCount,
      recentActivity,
    ] = await Promise.all([
      // Today fulfilled orders
      this.prisma.order.aggregate({
        where: {
          createdAt: { gte: today },
          status: OrderStatus.FULFILLED,
        },
        _sum: { total: true },
        _count: true,
      }),
      // Total gross revenue
      this.prisma.order.aggregate({
        where: { status: OrderStatus.FULFILLED },
        _sum: { total: true },
        _count: true,
      }),
      // Today verified deposits
      this.prisma.deposit.aggregate({
        where: {
          creditedAt: { gte: today },
          status: DepositStatus.CREDITED,
        },
        _sum: { verifiedAmount: true },
      }),
      // Total customers
      this.prisma.user.count(),
      // New customers today
      this.prisma.user.count({ where: { createdAt: { gte: today } } }),
      // Active products
      this.prisma.product.count({ where: { status: ProductStatus.ACTIVE } }),
      // Available stock
      this.prisma.inventoryItem.count({ where: { status: InventoryStatus.AVAILABLE } }),
      // Pending deposits
      this.prisma.deposit.count({ where: { status: DepositStatus.MANUAL_REVIEW } }),
      // Open tickets
      this.prisma.supportTicket.count({
        where: { status: { in: [TicketStatus.OPEN, TicketStatus.WAITING_ADMIN] } },
      }),
      // Open warranty
      this.prisma.warrantyClaim.count({
        where: { status: { in: [WarrantyStatus.OPEN, WarrantyStatus.UNDER_REVIEW] } },
      }),
      // Recent orders for activity feed
      this.prisma.order.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, telegramUsername: true } },
          items: true,
        },
      }),
    ]);

    return {
      revenue: {
        today: Number(todayOrders._sum.total || 0),
        total: Number(totalOrders._sum.total || 0),
        todayOrdersCount: todayOrders._count,
        totalOrdersCount: totalOrders._count,
      },
      deposits: {
        today: Number(todayDeposits._sum.verifiedAmount || 0),
        pendingReviews: pendingDepositsCount,
      },
      customers: {
        total: totalCustomers,
        today: newCustomersToday,
      },
      inventory: {
        activeProducts,
        availableItems: availableStockCount,
      },
      support: {
        openTickets: openTicketsCount,
        openWarrantyClaims: openWarrantyCount,
      },
      recentActivity: recentActivity.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customer: o.user.telegramUsername ? `@${o.user.telegramUsername}` : o.user.firstName,
        total: Number(o.total),
        status: o.status,
        createdAt: o.createdAt,
        itemCount: o.items.reduce((acc, i) => acc + i.quantity, 0),
      })),
    };
  }
}
