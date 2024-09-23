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
import { Controller, Inject, Logger } from '@nestjs/common';
import { ClientProxy, EventPattern, Payload } from '@nestjs/microservices';

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
export class SolverController {
  private readonly logger = new Logger(SolverController.name);

  constructor(
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
    this.logger.debug(`handling car moved event ${JSON.stringify(data)}`);

    const { gameId, cars, step } = data;
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

    const { solution } = await this.solve(cars);
    if (!solution) {
      this.logger.error(`no solution for game ${gameId}`);
      return;
    }

    const { updated: prevState } = await applyStep(cars, {
      carId: step.carId,
      direction: reverseMovementDirection(step.direction),
    });
    const { solution: prevSolution } = await this.solve(prevState!);

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
