import { BoardService, Step } from '@board/board';
import { CACHE_MANAGER, CacheStore } from '@nestjs/cache-manager';
import {
  BadRequestException,
  GoneException,
  Inject,
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/sequelize';
import { ulid } from 'ulidx';
import { Board } from '../../../libs/board/src/board.model';

interface GameState {
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

    const { error, updated, solved } = await this.boardService.applyStep(
      state.board,
      step,
    );
    if (error) {
      throw new BadRequestException(error);
    }

    state.steps.push(step);
    await this.gameState.set(
      `game:${gameId}`,
      {
        board: updated,
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
      step,
    });

    return solved ?? false;
  }

  private getGameExpiryTtlSecond(): number {
    return this.configService.get('GAME_EXPIRY_TTL_SECOND') ?? 5 * 60;
  }
}
