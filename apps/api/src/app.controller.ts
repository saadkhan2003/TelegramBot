import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return {
      status: 'online',
      service: 'Store Admin Enterprise API Engine',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      endpoints: {
        health: '/api/v1/admin/bot/status',
        docs: '/api/v1/admin',
      },
    };
  }
}
