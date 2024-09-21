import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller()
export class SolverController {
  private readonly logger = new Logger(SolverController.name);

  @EventPattern('car_moved')
  async handleCarMoved(@Payload() data: any) {
    this.logger.debug(`handle car moved event ${JSON.stringify(data)}`);
  }
}
