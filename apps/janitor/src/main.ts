import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { JanitorModule } from './janitor.module';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(JanitorModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));
  app.flushLogs();

  const configService = app.get(ConfigService);

  await app.listen(configService.get('JANITOR_PORT') ?? 3002);
}
bootstrap();
