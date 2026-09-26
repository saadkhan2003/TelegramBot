import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { AdminAuthGuard, RequirePermissions } from '../auth/auth.guard';
import { TxDirection, WalletTxType } from '@telegram-store/shared';

@Controller('admin/wallets')
@UseGuards(AdminAuthGuard)
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get('transactions')
  @RequirePermissions('wallets.view')
  async getTransactions(
    @Query('userId') userId?: string,
    @Query('walletId') walletId?: string,
    @Query('type') type?: WalletTxType,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.walletsService.getTransactions({
      userId,
      walletId,
      type,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  @Post('adjust')
  @RequirePermissions('wallets.adjust')
  async adjustWallet(
    @Body()
    body: {
      userId: string;
      direction: TxDirection;
      amount: number;
      reason: string;
    },
    @Req() req: any,
  ) {
    return this.walletsService.adjustWallet({
      userId: body.userId,
      direction: body.direction,
      amount: body.amount,
      reason: body.reason,
      adminId: req.admin.sub,
    });
  }
}
