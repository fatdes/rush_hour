import { Controller, Get } from '@nestjs/common';
import { SolverService } from './solver.service';

@Controller()
export class SolverController {
  constructor(private readonly solverService: SolverService) {}

  @Get()
  getHello(): string {
    return this.solverService.getHello();
  }
}
