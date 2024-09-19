export enum MovementDirection {
  Up,
  Right,
  Down,
  Left,
}

export interface Step {
  carId: number;
  direction: MovementDirection;
}

export class MoveCarDto implements Step {
  carId: number;
  direction: MovementDirection;
}
