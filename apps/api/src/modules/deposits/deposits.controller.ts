import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { DepositsService } from './deposits.service';
import { AdminAuthGuard, RequirePermissions } from '../auth/auth.guard';
import { DepositStatus } from '@telegram-store/shared';

@Controller('admin/deposits')
@UseGuards(AdminAuthGuard)
export class DepositsController {
  constructor(private readonly depositsService: DepositsService) {}

  @Get('networks')
  @RequirePermissions('deposits.view')
  async getNetworks() {
    return this.depositsService.getAllNetworksAdmin();
  }

  @Post('networks')
  @RequirePermissions('deposits.override')
  async createNetwork(
    @Body()
    body: {
      name: string;
      chain: string;
      currency?: string;
      symbol?: string;
      type?: string;
      accountTitle?: string;
      receivingAddress: string;
      instructions?: string;
      minDeposit?: number;
      isActive?: boolean;
      sortOrder?: number;
    },
  ) {
    return this.depositsService.createNetwork(body);
  }

  @Patch('networks/:id')
  @RequirePermissions('deposits.override')
  async updateNetwork(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      accountTitle?: string;
      receivingAddress?: string;
      instructions?: string;
      minDeposit?: number;
      isActive?: boolean;
      currency?: string;
      symbol?: string;
      type?: string;
      sortOrder?: number;
    },
  ) {
    return this.depositsService.updateNetwork(id, body);
  }

  @Delete('networks/:id')
  @RequirePermissions('deposits.override')
  async deleteNetwork(@Param('id') id: string) {
    return this.depositsService.deleteNetwork(id);
  }

  @Get()
  @RequirePermissions('deposits.view')
  async findAll(
    @Query('userId') userId?: string,
    @Query('status') status?: DepositStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.depositsService.findAll({
      userId,
      status,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  @Post(':id/credit')
  @RequirePermissions('deposits.override')
  async manualCredit(
    @Param('id') id: string,
    @Body() body: { amount: number; notes?: string },
    @Req() req: any,
  ) {
    return this.depositsService.creditDeposit(
      id,
      body.amount,
      { manualReviewNotes: body.notes },
      req.admin.sub,
    );
  }
}
