import { Car, Step } from './car';

export class CarMovedEvent {
  gameId: string;
  cars: Car[];
  step: Step;
}

export function emptyBoard(): number[][] {
  return new Array(6).fill([]).map(() => new Array(6).fill(0));
}
