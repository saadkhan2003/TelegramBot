import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { AdminAuthGuard, RequirePermissions } from '../auth/auth.guard';
import { CategoryStatus } from '@telegram-store/shared';

@Controller('admin/categories')
@UseGuards(AdminAuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @RequirePermissions('products.view')
  async findAll(@Query('includeInactive') includeInactive?: string) {
    return this.categoriesService.findAll(includeInactive === 'true');
  }

  @Get(':id')
  @RequirePermissions('products.view')
  async findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
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
  ) {
    return this.categoriesService.create(body);
  }

  @Patch(':id')
  @RequirePermissions('products.edit')
  async update(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.categoriesService.update(id, body);
  }

  @Delete(':id')
  @RequirePermissions('products.edit')
  async remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
