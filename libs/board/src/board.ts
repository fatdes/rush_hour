import * as crypto from 'crypto';
import { Car, CarPosition, MovementDirection, Step } from './car';

export class CarMovedEvent {
  gameId: string;
  cars: Car[];
  step: Step;
}

export function emptyBoard(): number[][] {
  return new Array(6).fill([]).map(() => new Array(6).fill(0));
}

export function createHash(carData: string | Car[]): string {
  const hash = crypto.createHash('sha256');
  hash.update(typeof carData === 'string' ? carData : JSON.stringify(carData));
  return hash.digest('hex');
}

export function canCarMove(
  board: number[][],
  car: Car,
  step: Step,
): { error?: string; move?: (_: CarPosition) => void } {
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

  const blockedBy = board[moveToV][moveToH];
  if (blockedBy) {
    return {
      error: `not possible to move car[${car.id}] to h:${moveToH} v:${moveToV} is blocked by car[${blockedBy}]`,
    };
  }

  return {
    move,
  };
}

export async function applyStep(
  cars: Car[],
  step: Step,
): Promise<{ error?: string; updated?: Car[]; solved?: boolean }> {
  const car: Car | undefined = cars.find((c) => c.id === step.carId);
  if (!car) {
    return {
      error: `invalid car[${step.carId}]`,
    };
  }

  const board: number[][] = emptyBoard();
  for (let c of cars) {
    for (let p of c.pos) {
      board[p.v][p.h] = c.id;
    }
  }

  const { error, move } = canCarMove(board, car, step);
  if (error) {
    return {
      error,
    };
  }

  // simple deep clone
  const updated = JSON.parse(JSON.stringify(cars)) as Car[];
  const moveCar: Car = updated.find((c) => c.id === step.carId)!;

  moveCar.pos.forEach((p) => {
    board[p.v][p.h] = 0;
  });
  moveCar.pos.forEach((p) => {
    move!(p);
    board[p.v][p.h] = car.id;
  });

  return {
    updated,
    solved: isSolved(board),
  };
}

export function isSolved(data: Car[] | number[][]): boolean {
  if (data.every((d) => typeof d === typeof Car)) {
    const p = (data as Car[]).find((c) => c.id === 1)?.pos.slice(-1)[0];
    return p?.h === 2 && p?.v === 5;
  }

  return (data as number[][])[2][5] === 1;
}
