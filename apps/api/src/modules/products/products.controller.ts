import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { AdminAuthGuard, RequirePermissions } from '../auth/auth.guard';
import { ProductStatus } from '@telegram-store/shared';

@Controller('admin/products')
@UseGuards(AdminAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @RequirePermissions('products.view')
  async findAll(
    @Req() req: any,
    @Query('categoryId') categoryId?: string,
    @Query('status') status?: ProductStatus,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const storeId = req.headers['x-store-id'] as string | undefined;
    return this.productsService.findAll({
      storeId,
      categoryId,
      status,
      search,
      includeInactive: true,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  @Get(':id')
  @RequirePermissions('products.view')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const storeId = req.headers['x-store-id'] as string | undefined;
    return this.productsService.findOne(id, storeId);
  }

  @Post()
  @RequirePermissions('products.edit')
  async create(@Body() body: any, @Req() req: any) {
    const storeId = req.headers['x-store-id'] as string | undefined;
    return this.productsService.create({ ...body, storeId });
  }

  @Patch(':id')
  @RequirePermissions('products.edit')
  async update(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    const storeId = req.headers['x-store-id'] as string | undefined;
    return this.productsService.update(id, body, storeId);
  }

  @Delete(':id')
  @RequirePermissions('products.edit')
  async archive(@Param('id') id: string, @Req() req: any) {
    const storeId = req.headers['x-store-id'] as string | undefined;
    return this.productsService.archive(id, storeId);
  }
}
