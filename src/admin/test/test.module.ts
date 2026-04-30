import { Module } from '@nestjs/common';
import { AdminTestController } from './test.controller';
import { AdminTestService } from './test.service';

@Module({
  controllers: [AdminTestController],
  providers: [AdminTestService],
})
export class AdminTestModule {}
