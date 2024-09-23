import { MovementDirection, Step } from '@board/board';

export class GameStateDto {
  board: number[][];
  steps: StepDto[];
}

export class StepDto {
  carId: number;
  direction: MovementDirection;
  comment: string;
}

export class MoveCarDto implements Step {
  carId: number;
  direction: MovementDirection;
}
