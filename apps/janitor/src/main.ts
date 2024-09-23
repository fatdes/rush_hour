import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { JanitorModule } from './janitor.module';

async function bootstrap() {
  const app = await NestFactory.create(JanitorModule);

  const configService = app.get(ConfigService);

  await app.listen(configService.get('JANITOR_PORT') ?? 3002);
}
bootstrap();
