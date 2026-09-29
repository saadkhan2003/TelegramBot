import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { AdminAuthGuard, RequirePermissions } from '../auth/auth.guard';

@Controller('admin')
@UseGuards(AdminAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('settings')
  @RequirePermissions('settings.manage')
  async getSettings() {
    return this.settingsService.getAllSettings();
  }

  @Patch('settings/:key')
  @RequirePermissions('settings.manage')
  async updateSetting(
    @Param('key') key: string,
    @Body() body: { value: any },
    @Req() req: any,
  ) {
    return this.settingsService.updateSetting(key, body.value, req.admin.sub);
  }

  @Get('translations')
  @RequirePermissions('settings.manage')
  async getTranslations(@Query('languageCode') languageCode?: string) {
    return this.settingsService.getTranslations(languageCode);
  }

  @Post('translations')
  @RequirePermissions('settings.manage')
  async updateTranslation(
    @Body() body: { key: string; languageCode: string; value: string },
  ) {
    return this.settingsService.updateTranslation(body.key, body.languageCode, body.value);
  }

  @Get('audit-logs')
  @RequirePermissions('admins.manage')
  async getAuditLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('resourceType') resourceType?: string,
  ) {
    return this.settingsService.getAuditLogs({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
      resourceType,
    });
  }

  @Get('bot-screens')
  @RequirePermissions('settings.manage')
  async getBotScreens(@Req() req: any) {
    const storeId = req.headers['x-store-id'] as string;
    return this.settingsService.getBotScreens(storeId);
  }

  @Put('bot-screens/:key')
  @RequirePermissions('settings.manage')
  async saveBotScreen(
    @Param('key') key: string,
    @Body() body: { components: any[]; meta?: any },
    @Req() req: any,
  ) {
    const storeId = req.headers['x-store-id'] as string;
    return this.settingsService.saveBotScreen(key, body, storeId);
  }

  @Delete('bot-screens/:key')
  @RequirePermissions('settings.manage')
  async deleteBotScreen(@Param('key') key: string, @Req() req: any) {
    const storeId = req.headers['x-store-id'] as string;
    return this.settingsService.deleteBotScreen(key, storeId);
  }
}
