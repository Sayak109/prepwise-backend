import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  seed(): void {
    this.logger.log('No seed data configured yet.');
  }
}
