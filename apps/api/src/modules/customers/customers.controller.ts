import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
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
    @Req() req: any,
    @Query('search') search?: string,
    @Query('status') status?: UserStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const storeId = req.headers['x-store-id'] as string | undefined;
    return this.customersService.findAll({
      storeId,
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

  @Delete(':id')
  @RequirePermissions('admins.manage')
  async delete(@Param('id') id: string) {
    return this.customersService.delete(id);
  }

  @Post('bulk-delete')
  @RequirePermissions('admins.manage')
  async bulkDelete(@Body() body: { ids: string[] }) {
    return this.customersService.bulkDelete(body.ids);
  }
}

