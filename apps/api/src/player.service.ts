import {
  boardFromCars,
  Car,
  CarMoveCommentedEvent,
  CarMovedEvent,
  MovementComment,
  Step,
} from '@board/board';
import { CACHE_MANAGER, CacheStore } from '@nestjs/cache-manager';
import {
  BadRequestException,
  ConflictException,
  GoneException,
  Inject,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/sequelize';
import { Redis } from 'ioredis';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { ulid } from 'ulidx';
import { Board } from './board.model';
import { BoardService } from './board.service';
import { GameStateDto, StepDto } from './dto/game.dto';

export interface GameState {
  board: Board;
  steps: Step[];
  solved: boolean;
}

@Injectable()
export class PlayerService {
  constructor(
    @InjectPinoLogger(PlayerService.name)
    private logger: PinoLogger,
    @InjectModel(Board)
    private boardModel: typeof Board,
    @Inject(ConfigService)
    private configService: ConfigService,
    @Inject(BoardService)
    private boardService: BoardService,
    @Inject(CACHE_MANAGER)
    private gameState: CacheStore,
    @Inject('REDIS_SERVICE')
    private redisClient: Redis,
    @Inject('KAFKA_SERVICE')
    private kafkaClient: ClientProxy,
  ) {}

  async startGame({ boardId }: { boardId: string }): Promise<string> {
    const board = await this.boardModel.findByPk(boardId);
    if (board === null) {
      throw new BadRequestException(`board "${boardId}" does not exists`);
    }

    const gameId = `GAME-${ulid()}`;

    this.logger.assign({ gameId });

    this.logger.debug(`creating game`);

    await this.gameState.set(
      `game:${gameId}`,
      {
        board,
        steps: [],
        solved: false,
      } as GameState,
      { ttl: this.getGameExpiryTtlSecond() },
    );

    return gameId;
  }

  async getGameState({ gameId }: { gameId: string }): Promise<GameStateDto> {
    const state: GameState = (await this.gameState.get(
      `game:${gameId}`,
    )) as GameState;
    if (!state) {
      throw new UnprocessableEntityException(
        `game ${gameId} not found, could be expired.`,
      );
    }

    const board = boardFromCars(JSON.parse(state.board.cars));
    const comment = (c?: MovementComment) => {
      switch (c) {
        case MovementComment.blunder:
          return 'blunder';
        case MovementComment.good:
          return 'good';
        case MovementComment.waste:
          return 'wasted';
        case MovementComment.calculating:
        default:
          return 'calculating';
      }
    };

    const steps = state.steps.map<StepDto>((s) => ({
      carId: s.carId,
      direction: s.direction,
      comment: comment(s.comment),
    }));

    return {
      board,
      steps,
    };
  }

  async moveCar({
    gameId,
    step,
  }: {
    gameId: string;
    step: Step;
  }): Promise<boolean> {
    this.logger.assign({ step });

    const acquired = await this.acquireLock(gameId);
    if (!acquired) {
      throw new ConflictException(
        `game ${gameId} is being updated, please try again later.`,
      );
    }

    try {
      const state: GameState = (await this.gameState.get(
        `game:${gameId}`,
      )) as GameState;
      if (!state) {
        throw new UnprocessableEntityException(
          `game ${gameId} not found, could be expired.`,
        );
      }

      if (state.solved) {
        throw new GoneException(`game ${gameId} is already solved.`);
      }

      const { error, updated, solved } = await this.boardService.applyStep(
        JSON.parse(state.board.cars) as Car[],
        step,
      );
      if (error) {
        throw new BadRequestException(error);
      }

      this.logger.assign({
        applyStep: true,
        currentStepLen: state.steps.length,
      });

      state.board.cars = JSON.stringify(updated);
      state.steps.push(step);

      await this.gameState.set(
        `game:${gameId}`,
        {
          board: state.board,
          steps: state.steps,
          solved,
        } as GameState,
        { ttl: this.getGameExpiryTtlSecond() },
      );

      this.logger.assign({
        cacheUpdated: true,
        updatedStepLen: state.steps.length,
      });

      this.kafkaClient.emit('car_moved', {
        gameId,
        cars: updated,
        step,
        stepId: state.steps.length,
      } as CarMovedEvent);

      this.logger.assign({ eventEmitted: true });

      return solved ?? false;
    } finally {
      await this.releaseLock(gameId);
    }
  }

  // FIXME: event pattern doesn't support pinolog.assign()
  async handleCarMoveCommented(data: CarMoveCommentedEvent) {
    this.logger.assign({ payload: data });

    const { gameId, stepId, comment } = data;

    const acquired = await this.acquireLock(gameId);
    if (!acquired) {
      // will try again
      throw new ConflictException(
        `game ${gameId} is being updated, please try again later.`,
      );
    }

    try {
      const state: GameState = (await this.gameState.get(
        `game:${data.gameId}`,
      )) as GameState;
      if (!state) {
        this.logger.debug(`game ${data.gameId} is already gone, ignore`);
        return;
      }

      this.logger.assign({ currentStepsLen: state.steps.length });

      if (state.steps.length < stepId) {
        this.logger.assign({
          err: `game ${data.gameId} has invalid step ${stepId} >= ${state.steps.length}`,
          skip: true,
        });
        return;
      }

      state.steps[stepId - 1].comment = comment;

      await this.gameState.set(`game:${gameId}`, state, {
        ttl: this.getGameExpiryTtlSecond(),
      });

      this.logger.assign({ cacheUpdated: true });
    } finally {
      await this.releaseLock(gameId);
    }
  }

  private getGameExpiryTtlSecond(): number {
    return this.configService.get('GAME_EXPIRY_TTL_SECOND') ?? 5 * 60;
  }

  // modified with retries https://medium.com/@geo.036036/handling-concurrent-requests-using-redis-cache-in-nodejs-93d8b6f7fa6a
  private async acquireLock(gameId: string): Promise<boolean> {
    let retries = 5;
    for (;;) {
      const lockKey = `lock:${gameId}`;
      const lockValue = Date.now() + 5000 + 1;
      const acquired = await this.redisClient.set(
        lockKey,
        lockValue,
        'PX',
        5000,
        'NX',
      );

      if (acquired === 'OK') {
        return true; // Lock acquired successfully.
      }

      if (--retries < 0) {
        break;
      }

      await new Promise((f) => setTimeout(f, 500));
    }

    return false; // Failed to acquire the lock.
  }

  private async releaseLock(gameId: string) {
    const lockKey = `lock:${gameId}`;
    await this.redisClient.del(lockKey);
  }
}
