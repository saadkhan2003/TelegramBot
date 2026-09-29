import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { SupportService } from './support.service';
import { AdminAuthGuard, RequirePermissions } from '../auth/auth.guard';
import { TicketStatus, WarrantyStatus } from '@telegram-store/shared';

@Controller('admin')
@UseGuards(AdminAuthGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('tickets')
  @RequirePermissions('support.manage')
  async getTickets(
    @Req() req: any,
    @Query('userId') userId?: string,
    @Query('status') status?: TicketStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const storeId = req.headers['x-store-id'] as string | undefined;
    return this.supportService.findTickets({
      storeId,
      userId,
      status,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  @Post('tickets/:id/reply')
  @RequirePermissions('support.manage')
  async replyTicket(
    @Param('id') id: string,
    @Body() body: { message: string },
    @Req() req: any,
  ) {
    return this.supportService.addAdminReply(id, req.admin.sub, body.message);
  }

  @Get('warranty')
  @RequirePermissions('support.manage')
  async getWarrantyClaims(
    @Query('userId') userId?: string,
    @Query('status') status?: WarrantyStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.supportService.findWarrantyClaims({
      userId,
      status,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  @Post('warranty/:id/approve-replacement')
  @RequirePermissions('support.manage')
  async approveReplacement(@Param('id') id: string, @Req() req: any) {
    return this.supportService.approveReplacement(id, req.admin.sub);
  }
}
