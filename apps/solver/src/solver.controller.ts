import {
  CarMoveCommentedEvent,
  CarMovedEvent,
  createHash,
  isSolved,
  MovementComment,
} from '@board/board';
import { Controller, Inject, Logger } from '@nestjs/common';
import { ClientProxy, EventPattern, Payload } from '@nestjs/microservices';
import { MultiUndirectedGraph } from 'graphology';

@Controller()
export class SolverController {
  private readonly logger = new Logger(SolverController.name);

  constructor(
    @Inject('KAFKA_SERVICE')
    private kafkaClient: ClientProxy,
  ) {}

  @EventPattern('car_moved')
  async handleCarMoved(@Payload() data: CarMovedEvent) {
    this.logger.debug(`handling car moved event ${JSON.stringify(data)}`);

    const cars = data.cars;
    const solved = isSolved(cars);

    if (solved) {
      // must to be a good move!
      this.kafkaClient.emit('car_move_commented', {
        gameId: data.gameId,
        stepId: data.stepId,
        comment: MovementComment.good,
      } as CarMoveCommentedEvent);
      return;
    }
  }
}
