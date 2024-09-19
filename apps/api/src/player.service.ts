import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotImplementedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ulid } from 'ulidx';
import { Board } from './board.model';
import { Step } from './dto/game.dto';

@Injectable()
export class PlayerService {
  private readonly logger = new Logger(PlayerService.name);

  constructor(
    @InjectModel(Board)
    private boardModel: typeof Board,
    @Inject(CACHE_MANAGER) private gameState: Cache,
  ) {}

  async startGame({ boardId }: { boardId: string }): Promise<string> {
    const board = await this.boardModel.findByPk(boardId);
    if (board === null) {
      throw new BadRequestException(`board "${boardId}" does not exists`);
    }

    const gameId = ulid();

    this.logger.debug(
      `creating game with board ${JSON.stringify({ boardId, gameId })}`,
    );

    await this.gameState.set(`game:${gameId}`, { boardId });

    return `GAME-${gameId}`;
  }

  async moveCar({
    gameId,
    step,
  }: {
    gameId: string;
    step: Step;
  }): Promise<boolean> {
    this.logger.debug(`move car ${JSON.stringify({ gameId, step })}`);

    throw new NotImplementedException();
  }
}
