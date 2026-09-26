import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { TeamController } from './team.controller';

@Module({
  controllers: [AdminController, TeamController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
