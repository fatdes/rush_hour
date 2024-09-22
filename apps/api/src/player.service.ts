import { Car, CarMoveCommentedEvent, CarMovedEvent, Step } from '@board/board';
import { CACHE_MANAGER, CacheStore } from '@nestjs/cache-manager';
import {
  BadRequestException,
  ConflictException,
  GoneException,
  Inject,
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/sequelize';
import { Redis } from 'ioredis';
import { ulid } from 'ulidx';
import { Board } from './board.model';
import { BoardService } from './board.service';

export interface GameState {
  board: Board;
  steps: Step[];
  solved: boolean;
}

@Injectable()
export class PlayerService {
  private readonly logger = new Logger(PlayerService.name);

  constructor(
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

    this.logger.debug(`creating game ${JSON.stringify({ boardId, gameId })}`);

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

  async moveCar({
    gameId,
    step,
  }: {
    gameId: string;
    step: Step;
  }): Promise<boolean> {
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

    this.logger.debug(`moving car ${JSON.stringify({ gameId, state, step })}`);

    const acquired = await this.acquireLock(gameId);
    if (!acquired) {
      throw new ConflictException(
        `game ${gameId} is being updated, please try again later.`,
      );
    }

    try {
      const { error, updated, solved } = await this.boardService.applyStep(
        JSON.parse(state.board.cars) as Car[],
        step,
      );
      if (error) {
        throw new BadRequestException(error);
      }

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

      this.logger.debug(
        `moved car ${JSON.stringify({ gameId, state: { updated, steps: state.steps, solved } })}`,
      );

      this.kafkaClient.emit('car_moved', {
        gameId,
        cars: updated,
        step,
        stepId: state.steps.length,
      } as CarMovedEvent);

      return solved ?? false;
    } finally {
      await this.releaseLock(gameId);
    }
  }

  async handleCarMoveCommented(data: CarMoveCommentedEvent) {
    this.logger.debug(
      `handling car move commented event ${JSON.stringify(data)}`,
    );

    const { gameId, stepId, comment } = data;

    const state: GameState = (await this.gameState.get(
      `game:${data.gameId}`,
    )) as GameState;
    if (!state) {
      this.logger.debug(`game ${data.gameId} is already gone, ignore`);
      return;
    }

    if (state.steps.length < stepId) {
      this.logger.error(
        `game ${data.gameId} has invalid step ${stepId} >= ${state.steps.length}, skip`,
      );
      return;
    }

    const acquired = await this.acquireLock(gameId);
    if (!acquired) {
      // will try again
      throw new ConflictException(
        `game ${gameId} is being updated, please try again later.`,
      );
    }

    try {
      state.steps[stepId - 1].comment = comment;

      await this.gameState.set(`game:${gameId}`, state, {
        ttl: this.getGameExpiryTtlSecond(),
      });
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
