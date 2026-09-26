import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { AdminAuthGuard, RequirePermissions } from '../auth/auth.guard';
import { UserStatus } from '@telegram-store/shared';

@Controller('admin/customers')
@UseGuards(AdminAuthGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @RequirePermissions('orders.view')
  async findAll(
    @Query('search') search?: string,
    @Query('status') status?: UserStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.customersService.findAll({
      search,
      status,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  @Get(':id')
  @RequirePermissions('orders.view')
  async findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Patch(':id/status')
  @RequirePermissions('admins.manage')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: UserStatus },
  ) {
    return this.customersService.updateStatus(id, body.status);
  }
}
