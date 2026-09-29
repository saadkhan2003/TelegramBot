import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { StoresService } from './stores.service';
import { AdminAuthGuard } from '../auth/auth.guard';

@Controller('admin/stores')
@UseGuards(AdminAuthGuard)
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get()
  async getStores(@Req() req: any) {
    return this.storesService.findStoresForAdmin(req.admin.sub);
  }

  @Post()
  async createStore(
    @Body()
    body: {
      name: string;
      slug?: string;
      tagline?: string;
      currency?: string;
      botToken?: string;
      welcomeMessage?: string;
      supportUsername?: string;
    },
    @Req() req: any,
  ) {
    return this.storesService.createStore(body, req.admin.sub);
  }

  @Post('verify-token')
  async verifyToken(@Body() body: { token: string }) {
    return this.storesService.verifyBotToken(body.token);
  }

  @Get(':id')
  async getStore(@Param('id') id: string, @Req() req: any) {
    return this.storesService.findOne(id, req.admin.sub);
  }

  @Patch(':id')
  async updateStore(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      tagline?: string;
      currency?: string;
      botToken?: string;
      welcomeMessage?: string;
      supportUsername?: string;
      botStatus?: string;
    },
    @Req() req: any,
  ) {
    return this.storesService.updateStore(id, body, req.admin.sub);
  }

  @Delete(':id')
  async deleteStore(@Param('id') id: string, @Req() req: any) {
    return this.storesService.deleteStore(id, req.admin.sub);
  }
}
