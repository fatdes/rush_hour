import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { SolverModule } from './solver.module';

async function bootstrap() {
  const app = await NestFactory.create(SolverModule);

  const configService = app.get(ConfigService);

  if (configService.get('ENABLE_DEV_CORS')) {
    Logger.warn('DEV CORS is ENABLED!!!');
    app.enableCors({ origin: 'http://*:8080' });
  }
  await app.listen(configService.get('SOLVER_PORT') ?? 3001);
}
bootstrap();
