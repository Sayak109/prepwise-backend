import { Module } from '@nestjs/common';
import { ActivityLogService } from './activity_log.service';
import { ActivityLogController } from './activity_log.controller';

@Module({
  controllers: [ActivityLogController],
  providers: [ActivityLogService],
  exports: [ActivityLogService],
})
export class ActivityLogModule {}
