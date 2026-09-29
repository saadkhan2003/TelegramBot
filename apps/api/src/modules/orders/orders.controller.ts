import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
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
    @Req() req: any,
    @Query('userId') userId?: string,
    @Query('status') status?: OrderStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const storeId = req.headers['x-store-id'] as string | undefined;
    return this.ordersService.findAll({
      storeId,
      userId,
      status,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  @Get(':id')
  @RequirePermissions('orders.view')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const storeId = req.headers['x-store-id'] as string | undefined;
    return this.ordersService.findOne(id, storeId);
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

  @Delete(':id')
  @RequirePermissions('orders.refund')
  async delete(@Param('id') id: string) {
    return this.ordersService.delete(id);
  }

  @Post('bulk-delete')
  @RequirePermissions('orders.refund')
  async bulkDelete(@Body() body: { ids: string[] }) {
    return this.ordersService.bulkDelete(body.ids);
  }
}
