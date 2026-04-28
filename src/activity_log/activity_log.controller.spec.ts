import { Test, TestingModule } from '@nestjs/testing';
import { ActivityLogController } from './activity_log.controller';
import { ActivityLogService } from './activity_log.service';

describe('ActivityLogController', () => {
  let controller: ActivityLogController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActivityLogController],
      providers: [ActivityLogService],
    }).compile();

    controller = module.get<ActivityLogController>(ActivityLogController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
