import {
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Board } from './board.model';

import { InjectModel } from '@nestjs/sequelize';
import { emptyBoard } from './utils/array';

interface CarIndex {
  h: number;
  v: number;
}

@Injectable()
export class GMService {
  private readonly logger = new Logger(GMService.name);

  constructor(
    @InjectModel(Board)
    private boardModel: typeof Board,
  ) {}

  async createBoard({ raw }: { raw: number[][] }): Promise<Board> {
    if (!this.isSixBySixBoard(raw)) {
      throw new UnprocessableEntityException('board must be 6x6 number array');
    }

    this.logger.debug(`creating board ${JSON.stringify({ raw })}`);

    const { error, rawH, rawV } = this.normalizeRawBoard(raw);
    if (error) {
      throw new UnprocessableEntityException(error);
    }

    const h: string = '';
    const v: string = '';
    const hash: string = 'TODO';

    const [board, isNew] = await this.boardModel.findCreateFind({
      where: { hash },
      defaults: {
        h,
        v,
        hash,
      },
    });

    this.logger.log(
      `created board ${JSON.stringify({ id: board.id, hash: board.hash, isNew })}`,
    );

    return board;
  }

  private isSixBySixBoard(raw: number[][]): boolean {
    return raw.length === 6 && raw.every((r) => r && r.length === 6) === true;
  }

  private normalizeRawBoard(raw: number[][]): {
    error?: string;
    rawH?: number[][];
    rawV?: number[][];
  } {
    const cars: Map<number, Array<{ h: number; v: number }>> = new Map();

    for (let v = 0; v < 6; v++) {
      for (let h = 0; h < 6; h++) {
        const value = raw[v][h];

        if (!Number.isInteger(value)) {
          return {
            error: `[${v}][${h}] is not an integer`,
          };
        }

        switch (true) {
          case value < 0:
            return {
              error: `[${v}][${h}] is negative integer`,
            };

          case value > 0:
            let car = cars.get(value);
            if (!car) {
              car = [];
              cars.set(value, car);
            }
            car.push({ h, v });

            break;
          // i.e. value === 0
          default:
        }
      }
    }

    // TODO: normalize cars by the position

    const rawH: number[][] = emptyBoard();
    const rawV: number[][] = emptyBoard();

    return {
      rawH,
      rawV,
    };
  }
}
