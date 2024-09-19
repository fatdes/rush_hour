import {
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Board } from './board.model';

import { InjectModel } from '@nestjs/sequelize';
import { Car, CarDirection } from './car';
import { emptyBoard } from './utils/array';

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

    const h: string = JSON.stringify(rawH);
    const v: string = JSON.stringify(rawV);
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
      `created board ${JSON.stringify({ id: board.id, hash: board.hash, isNew, h, v })}`,
    );

    return board;
  }

  private isSixBySixBoard(raw: number[][]): boolean {
    return raw.length === 6 && raw.every((r) => r && r.length === 6) === true;
  }

  private placeCar(raw: number[][], car: Car) {
    for (let position of car.positions()) {
      raw[position.v][position.h] = car.id;
    }
  }

  private normalizeRawBoard(raw: number[][]): {
    error?: string;
    rawH?: number[][];
    rawV?: number[][];
  } {
    const cars: Map<number, Car> = new Map();
    const rawH: number[][] = emptyBoard();
    const rawV: number[][] = emptyBoard();

    for (let v = 0; v < 6; v++) {
      for (let h = 0; h < 6; h++) {
        const value = raw[v][h];

        if (!Number.isInteger(value)) {
          return {
            error: `[${v}][${h}] is not an integer, should be non negative integer`,
          };
        }

        switch (true) {
          case value < 0:
            return {
              error: `[${v}][${h}] is negative integer, should be non negative integer`,
            };

          case value > 0:
            let car = cars.get(value);
            if (!car) {
              car = new Car(value);
              cars.set(value, car);
            }
            if (!car.addPosition({ h, v })) {
              return {
                error: `car[${value}] is not placed correctly`,
              };
            }

            break;
          case value === 0:
          default:
        }
      }
    }

    if (
      cars.size === 0 ||
      cars.get(1) === undefined ||
      cars.get(1)!.size() !== 2 ||
      !cars
        .get(1)!
        .positions()
        .every(({ v }) => v === 2)
    ) {
      return {
        error: `board must have car[1] of size 2 at row 2`,
      };
    }

    for (let car of cars.values()) {
      if (!car.isValidSize()) {
        return {
          error: `car[${car.id}] is invalid size "${car.size()}"`,
        };
      }

      switch (car.direction()) {
        case CarDirection.horizational:
          this.placeCar(rawH, car);

          break;
        case CarDirection.vertical:
          this.placeCar(rawV, car);
          break;
      }
    }

    // TODO: normalize cars by the position

    return {
      rawH,
      rawV,
    };
  }
}
