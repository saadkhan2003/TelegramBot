import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { AdminAuthGuard, RequirePermissions } from '../auth/auth.guard';
import { OrderStatus } from '@telegram-store/shared';

@Controller('admin/orders')
@UseGuards(AdminAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @RequirePermissions('orders.view')
  async findAll(
    @Query('userId') userId?: string,
    @Query('status') status?: OrderStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.ordersService.findAll({
      userId,
      status,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  @Get(':id')
  @RequirePermissions('orders.view')
  async findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Post(':id/refund')
  @RequirePermissions('orders.refund')
  async refund(
    @Param('id') id: string,
    @Body() body: { amount?: number; reason: string; notes?: string },
    @Req() req: any,
  ) {
    return this.ordersService.processRefund({
      orderId: id,
      amount: body.amount,
      reason: body.reason,
      notes: body.notes,
      adminId: req.admin.sub,
    });
  }

  @Post(':id/fulfill')
  @RequirePermissions('orders.view')
  async fulfillOrder(
    @Param('id') id: string,
    @Body() body: { payload: string; notes?: string },
    @Req() req: any,
  ) {
    return this.ordersService.fulfillManualOrder({
      orderId: id,
      deliveryPayload: body.payload,
      notes: body.notes,
      adminId: req.admin.sub,
    });
  }
}
