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

export enum CarDirection {
  invalid = 0,
  horizational = 1,
  vertical = 2,
}

export interface CarPosition {
  h: number;
  v: number;
}

// handy car class to validate size and direction, etc..
export class Car {
  pos: CarPosition[] = [];
  dir: CarDirection = CarDirection.invalid;

  constructor(readonly id: number) {}

  size(): number {
    return this.pos.length;
  }

  direction(): CarDirection {
    return this.dir;
  }

  isValidSize(): boolean {
    return this.pos.length === 2 || this.pos.length === 3;
  }

  addPosition(newP: CarPosition): boolean {
    if (this.pos.length === 0) {
      this.pos.push(newP);
      return true;
    }

    if (this.pos.length === 1) {
      const d = this.checkDirection(this.pos[0], newP);
      if (CarDirection.invalid === d) {
        return false;
      }

      this.dir = d;
      this.pos.push(newP);
      return true;
    }

    const d = this.checkDirection(this.pos.slice(-1)[0], newP);
    if (this.dir !== d) {
      return false;
    }
    this.pos.push(newP);

    return true;
  }

  private checkDirection(p1: CarPosition, p2: CarPosition): CarDirection {
    if (p1.h === p2.h) {
      return p1.v === p2.v - 1 ? CarDirection.vertical : CarDirection.invalid;
    } else if (p1.v === p2.v) {
      return p1.h === p2.h - 1
        ? CarDirection.horizational
        : CarDirection.invalid;
    }

    return CarDirection.invalid;
  }
}
