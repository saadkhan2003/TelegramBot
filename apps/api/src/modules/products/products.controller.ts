import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
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
    @Query('categoryId') categoryId?: string,
    @Query('status') status?: ProductStatus,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.productsService.findAll({
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
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @RequirePermissions('products.edit')
  async create(@Body() body: any) {
    return this.productsService.create(body);
  }

  @Patch(':id')
  @RequirePermissions('products.edit')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.productsService.update(id, body);
  }

  @Delete(':id')
  @RequirePermissions('products.edit')
  async archive(@Param('id') id: string) {
    return this.productsService.archive(id);
  }
}
