import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { AdminAuthGuard, RequirePermissions } from '../auth/auth.guard';
import { InventoryStatus } from '@telegram-store/shared';

@Controller('admin/inventory')
@UseGuards(AdminAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @RequirePermissions('inventory.view')
  async findAll(
    @Req() req: any,
    @Query('productId') productId?: string,
    @Query('status') status?: InventoryStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const storeId = req.headers['x-store-id'] as string | undefined;
    return this.inventoryService.findAll({
      storeId,
      productId,
      status,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  @Get(':id/reveal')
  @RequirePermissions('inventory.credentials_view')
  async reveal(@Param('id') id: string) {
    return this.inventoryService.revealCredentials(id);
  }

  @Post('validate-import')
  @RequirePermissions('inventory.create')
  async validateImport(
    @Body() body: { rawContent: string; delimiter?: string },
  ) {
    return this.inventoryService.validateImport(body.rawContent, body.delimiter);
  }

  @Post('import')
  @RequirePermissions('inventory.create')
  async importBulk(
    @Body()
    body: {
      productId: string;
      rawContent: string;
      delimiter?: string;
      supplierId?: string;
      purchaseCost?: number;
      purchaseReference?: string;
    },
  ) {
    return this.inventoryService.importBulk(body);
  }

  @Patch(':id/status')
  @RequirePermissions('inventory.create')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: InventoryStatus },
  ) {
    return this.inventoryService.updateStatus(id, body.status);
  }

  @Patch(':id')
  @RequirePermissions('inventory.create')
  async updateItem(
    @Param('id') id: string,
    @Body()
    body: {
      purchaseCost?: number | null;
      status?: InventoryStatus;
      purchaseReference?: string | null;
    },
  ) {
    return this.inventoryService.updateItem(id, body);
  }
}
