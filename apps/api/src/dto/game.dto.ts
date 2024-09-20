import { MovementDirection, Step } from '@board/board';

export class MoveCarDto implements Step {
  carId: number;
  direction: MovementDirection;
}
