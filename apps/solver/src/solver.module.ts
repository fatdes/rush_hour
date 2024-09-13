import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { SolverController } from './solver.controller';
import { SolverService } from './solver.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TerminusModule.forRoot({
      gracefulShutdownTimeoutMs: 1000,
    }),
  ],
  controllers: [HealthController, SolverController],
  providers: [SolverService],
})
export class SolverModule {}
