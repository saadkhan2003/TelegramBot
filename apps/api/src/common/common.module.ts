import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { TelegramNotifyService } from './telegram-notify.service';

@Global()
@Module({
  providers: [PrismaService, TelegramNotifyService],
  exports: [PrismaService, TelegramNotifyService],
})
export class CommonModule {}
