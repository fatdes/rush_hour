import { CanonicalLogInterceptor } from '@app/middleware';
import {
  applyStep,
  Car,
  CarMoveCommentedEvent,
  CarMovedEvent,
  createHash,
  isSolved,
  MovementComment,
  MovementDirection,
  reverseMovementDirection,
  Step,
} from '@board/board';
import { Controller, Inject, UseInterceptors } from '@nestjs/common';
import { ClientProxy, EventPattern, Payload } from '@nestjs/microservices';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

class Check {
  steps: Step[];

  constructor(
    private readonly cars: Car[],
    steps?: Step[],
  ) {
    this.steps = steps ?? [];
  }

  async check(
    visited: Set<string>,
    queue: Check[],
  ): Promise<Check | undefined> {
    for (let car of this.cars) {
      for (let direction of [
        MovementDirection.Right,
        MovementDirection.Down,
        MovementDirection.Up,
        MovementDirection.Left,
      ]) {
        const step: Step = {
          carId: car.id,
          direction,
        };

        const { error, updated, solved } = await applyStep(this.cars, step);
        if (error) {
          continue;
        }

        const hash = createHash(updated!);
        if (visited.has(hash)) {
          continue;
        }
        visited.add(hash);

        const steps = [...this.steps];
        steps.push(step);
        const check = new Check(updated!, steps);

        if (solved) {
          return check;
        }

        queue.push(check);
      }
    }
  }
}

@Controller()
@UseInterceptors(CanonicalLogInterceptor)
export class SolverController {
  constructor(
    @InjectPinoLogger(SolverController.name)
    private logger: PinoLogger,
    @Inject('KAFKA_SERVICE')
    private kafkaClient: ClientProxy,
  ) {}

  async solve(cars: Car[]): Promise<{ solution?: Step[] }> {
    const solved = isSolved(cars);

    if (solved) {
      return {
        solution: [],
      };
    }

    const visited: Set<string> = new Set();
    let queue: Check[] = [];

    queue.push(new Check(cars));

    while (queue.length !== 0) {
      const batch = queue;
      queue = [];

      for (const item of batch) {
        const found = await item.check(visited, queue);
        if (found) {
          return {
            solution: found.steps,
          };
        }
      }
    }

    return {};
  }

  @EventPattern('car_moved')
  async handleCarMoved(@Payload() data: CarMovedEvent) {
    this.logger.assign({ payload: data });

    const { gameId, cars, step } = data;
    const solved = isSolved(cars);

    this.logger.assign({ solved });

    if (solved) {
      // must to be a good move!
      this.kafkaClient.emit('car_move_commented', {
        gameId: data.gameId,
        stepId: data.stepId,
        comment: MovementComment.good,
      } as CarMoveCommentedEvent);
      return;
    }

    const { solution } = await this.solve(cars);
    this.logger.assign({ solutionLen: solution?.length ?? -1 });
    if (!solution) {
      return;
    }

    const { updated: prevState } = await applyStep(cars, {
      carId: step.carId,
      direction: reverseMovementDirection(step.direction),
    });
    const { solution: prevSolution } = await this.solve(prevState!);

    this.logger.assign({ prevSolutionLen: prevSolution?.length ?? -1 });

    this.kafkaClient.emit('car_move_commented', {
      gameId: data.gameId,
      stepId: data.stepId,
      comment:
        solution!.length < prevSolution!.length
          ? MovementComment.good
          : solution!.length === prevSolution!.length
            ? MovementComment.waste
            : MovementComment.blunder,
    } as CarMoveCommentedEvent);
  }
}
