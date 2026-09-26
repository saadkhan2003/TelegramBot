import { Module } from '@nestjs/common';
import { DepositsService } from './deposits.service';
import { DepositsController } from './deposits.controller';
import { WalletsModule } from '../wallets/wallets.module';

@Module({
  imports: [WalletsModule],
  controllers: [DepositsController],
  providers: [DepositsService],
  exports: [DepositsService],
})
export class DepositsModule {}
