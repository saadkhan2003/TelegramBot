import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { AdminAuthGuard, RequirePermissions } from '../auth/auth.guard';
import { CategoryStatus } from '@telegram-store/shared';

@Controller('admin/categories')
@UseGuards(AdminAuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @RequirePermissions('products.view')
  async findAll(@Req() req: any, @Query('includeInactive') includeInactive?: string) {
    const storeId = req.headers['x-store-id'] as string | undefined;
    return this.categoriesService.findAll(includeInactive === 'true', storeId);
  }

  @Get(':id')
  @RequirePermissions('products.view')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const storeId = req.headers['x-store-id'] as string | undefined;
    return this.categoriesService.findOne(id, storeId);
  }

  @Post()
  @RequirePermissions('products.edit')
  async create(
    @Body()
    body: {
      name: string;
      emoji?: string;
      description?: string;
      status?: CategoryStatus;
      sortOrder?: number;
      parentId?: string;
    },
    @Req() req: any,
  ) {
    const storeId = req.headers['x-store-id'] as string | undefined;
    return this.categoriesService.create({ ...body, storeId });
  }

  @Patch(':id')
  @RequirePermissions('products.edit')
  async update(
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: any,
  ) {
    const storeId = req.headers['x-store-id'] as string | undefined;
    return this.categoriesService.update(id, body, storeId);
  }

  @Delete(':id')
  @RequirePermissions('products.edit')
  async remove(@Param('id') id: string, @Req() req: any) {
    const storeId = req.headers['x-store-id'] as string | undefined;
    return this.categoriesService.remove(id, storeId);
  }
}
