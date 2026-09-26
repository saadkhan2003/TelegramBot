import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import {
  generateTicketNumber,
  generateWarrantyNumber,
  InventoryStatus,
  MessageSenderType,
  TicketPriority,
  TicketStatus,
  WarrantyStatus,
} from '@telegram-store/shared';

@Injectable()
export class SupportService {
  constructor(private readonly prisma: PrismaService) {}

  // Tickets
  async findTickets(params?: {
    userId?: string;
    status?: TicketStatus;
    page?: number;
    limit?: number;
  }) {
    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params?.userId) where.userId = params.userId;
    if (params?.status) where.status = params.status;

    const [items, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          user: { select: { id: true, telegramUserId: true, telegramUsername: true, firstName: true } },
          assignedAdmin: { select: { id: true, email: true } },
          messages: { orderBy: { createdAt: 'asc' } },
        },
      }),
      this.prisma.supportTicket.count({ where }),
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

  async createTicket(data: {
    userId: string;
    orderId?: string;
    category: string;
    priority?: TicketPriority;
    initialMessage: string;
  }) {
    const ticketNumber = generateTicketNumber();

    const ticket = await this.prisma.supportTicket.create({
      data: {
        ticketNumber,
        userId: data.userId,
        orderId: data.orderId,
        category: data.category,
        priority: data.priority || TicketPriority.NORMAL,
        status: TicketStatus.OPEN,
        messages: {
          create: {
            senderType: MessageSenderType.CUSTOMER,
            messageText: data.initialMessage,
          },
        },
      },
      include: { messages: true },
    });

    return ticket;
  }

  async addAdminReply(ticketId: string, adminId: string, text: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: { user: true },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');

    const msg = await this.prisma.supportMessage.create({
      data: {
        ticketId,
        senderType: MessageSenderType.ADMIN,
        senderAdminId: adminId,
        messageText: text,
      },
    });

    await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: TicketStatus.WAITING_CUSTOMER,
        assignedAdminId: adminId,
        updatedAt: new Date(),
      },
    });

    return { message: msg, customerTelegramId: ticket.user.telegramUserId.toString() };
  }

  // Warranty Claims
  async findWarrantyClaims(params?: {
    userId?: string;
    status?: WarrantyStatus;
    page?: number;
    limit?: number;
  }) {
    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params?.userId) where.userId = params.userId;
    if (params?.status) where.status = params.status;

    const [items, total] = await Promise.all([
      this.prisma.warrantyClaim.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, telegramUserId: true, telegramUsername: true, firstName: true } },
          order: true,
          orderItem: { include: { product: true } },
          assignedAdmin: { select: { id: true, email: true } },
        },
      }),
      this.prisma.warrantyClaim.count({ where }),
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

  async createWarrantyClaim(data: {
    userId: string;
    orderId: string;
    orderItemId: string;
    reason: string;
    customerMessage: string;
  }) {
    const claimNumber = generateWarrantyNumber();
    return this.prisma.warrantyClaim.create({
      data: {
        claimNumber,
        userId: data.userId,
        orderId: data.orderId,
        orderItemId: data.orderItemId,
        reason: data.reason,
        customerMessage: data.customerMessage,
        status: WarrantyStatus.OPEN,
      },
    });
  }

  /**
   * Approves a replacement item for a warranty claim (PRD Section 54)
   */
  async approveReplacement(claimId: string, adminId: string) {
    return this.prisma.$transaction(async (tx) => {
      const claim = await tx.warrantyClaim.findUnique({
        where: { id: claimId },
        include: { orderItem: { include: { product: true } } },
      });

      if (!claim) throw new NotFoundException('Warranty claim not found');

      // Find available inventory item
      const newItem = await tx.inventoryItem.findFirst({
        where: {
          productId: claim.orderItem.productId,
          status: InventoryStatus.AVAILABLE,
        },
      });

      if (!newItem) {
        throw new BadRequestException('No replacement inventory currently available in stock');
      }

      // Mark replacement inventory as SOLD
      await tx.inventoryItem.update({
        where: { id: newItem.id },
        data: {
          status: InventoryStatus.SOLD,
          soldOrderItemId: claim.orderItemId,
          soldAt: new Date(),
        },
      });

      // Update warranty claim
      const updatedClaim = await tx.warrantyClaim.update({
        where: { id: claimId },
        data: {
          status: WarrantyStatus.REPLACED,
          assignedAdminId: adminId,
          replacementInventoryId: newItem.id,
          resolution: 'Approved and replaced with fresh stock unit',
          resolvedAt: new Date(),
        },
        include: { user: true, orderItem: { include: { product: true } } },
      });

      return {
        claim: updatedClaim,
        replacementItem: newItem,
      };
    });
  }
}
