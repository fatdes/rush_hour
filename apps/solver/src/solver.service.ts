import { Injectable } from '@nestjs/common';

@Injectable()
export class SolverService {
  getHello(): string {
    return 'Hello World!';
  }
}
