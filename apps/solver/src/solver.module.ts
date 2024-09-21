import { Module } from '@nestjs/common';
import { SolverController } from './solver.controller';

@Module({
  imports: [],
  controllers: [SolverController],
  providers: [],
})
export class SolverModule {}
