import {
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import * as crypto from 'crypto';
import { Board, emptyBoard } from './board.model';
import { Car, CarPosition, MovementDirection, Step } from './car';

@Injectable()
export class BoardService {
  private readonly logger = new Logger(BoardService.name);

  constructor(
    @InjectModel(Board)
    private boardModel: typeof Board,
  ) {}

  async createBoard({ raw }: { raw: number[][] }): Promise<Board> {
    if (!this.isSixBySixBoard(raw)) {
      throw new UnprocessableEntityException('board must be 6x6 number array');
    }

    this.logger.debug(`creating board ${JSON.stringify({ raw })}`);

    const { error, cars } = this.normalizeRawBoard(raw);
    if (error) {
      throw new UnprocessableEntityException(error);
    }

    const carsString: string = JSON.stringify(cars);

    const [board, isNew] = await this.boardModel.findCreateFind({
      where: { cars: carsString },
      defaults: {
        cars: carsString,
        hash: this.createHash(carsString),
        h: '',
        v: '',
      },
    });

    this.logger.log(
      `created board ${JSON.stringify({ id: board.id, isNew, cars: carsString })}`,
    );

    return board;
  }

  async applyStep(
    board: Board,
    step: Step,
  ): Promise<{ error?: string; updated?: Board; solved?: boolean }> {
    const raw: number[][] = emptyBoard();
    const cars: Car[] = JSON.parse(board.cars);
    const car: Car | undefined = cars.find((c) => c.id === step.carId);
    if (!car) {
      return {
        error: `invalid car[${step.carId}]`,
      };
    }

    for (let c of cars) {
      for (let p of c.pos) {
        raw[p.v][p.h] = c.id;
      }
    }

    let moveToH: number = -999;
    let moveToV: number = -999;
    let move = (_: CarPosition) => {};

    const positions = car.pos;
    switch (step.direction) {
      case MovementDirection.Left:
        moveToH = positions[0].h - 1;
        moveToV = positions[0].v;
        move = (p: CarPosition) => {
          p.h -= 1;
        };
        break;
      case MovementDirection.Right:
        moveToH = positions.slice(-1)[0].h + 1;
        moveToV = positions[0].v;
        move = (p: CarPosition) => {
          p.h += 1;
        };
        break;
      case MovementDirection.Up:
        moveToH = positions[0].h;
        moveToV = positions[0].v - 1;
        move = (p: CarPosition) => {
          p.v -= 1;
        };
        break;
      case MovementDirection.Down:
        moveToH = positions[0].h;
        moveToV = positions.slice(-1)[0].v + 1;
        move = (p: CarPosition) => {
          p.v += 1;
        };
        break;
    }

    if (moveToH < 0 || moveToH > 5 || moveToV < 0 || moveToV > 5) {
      return {
        error: `not possible to move car[${car.id}] to h:${moveToH} v:${moveToV} due to out of the board`,
      };
    }

    const blockedBy = raw[moveToV][moveToH];
    if (blockedBy) {
      return {
        error: `not possible to move car[${car.id}] to h:${moveToH} v:${moveToV} is blocked by car[${blockedBy}]`,
      };
    }

    positions.forEach((p) => {
      raw[p.v][p.h] = 0;
    });
    positions.forEach((p) => {
      move(p);
      raw[p.v][p.h] = car.id;
    });

    board.cars = JSON.stringify(cars);

    return {
      updated: board,
      solved: raw[2][5] === 1,
    };
  }

  private isSixBySixBoard(board: number[][]): boolean {
    return (
      board.length === 6 && board.every((r) => r && r.length === 6) === true
    );
  }

  private normalizeRawBoard(raw: number[][]): {
    error?: string;
    cars?: Car[];
  } {
    const cars: Map<number, Car> = new Map();

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
      !cars.get(1)!.pos.every(({ v }) => v === 2)
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
    }

    // TODO: normalize cars by the position

    return {
      cars: [...cars.entries()]
        .sort(([id1], [id2]) => id1 - id2)
        .map(([_, car]) => car),
    };
  }

  private createHash(carString: string): string {
    const hash = crypto.createHash('sha256');
    hash.update(carString);
    return hash.digest('hex');
  }
}
