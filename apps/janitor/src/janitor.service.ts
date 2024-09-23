import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';

@Injectable()
export class JanitorService {
  private readonly logger = new Logger(JanitorService.name);

  // every 10 seconds
  @Interval(10000)
  cleanup() {
    this.logger.debug('cleaning up...');
  }
}
