import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ApiModule } from './api.module';
import metadata from './metadata';

async function bootstrap() {
  const app = await NestFactory.create(ApiModule);

  const configService = app.get(ConfigService);

  if (configService.get('ENABLE_DEV_CORS')) {
    Logger.warn('DEV CORS is ENABLED!!!');
    app.enableCors({ origin: 'http://*:8080' });
  }
  app.useGlobalPipes(new ValidationPipe({}));

  await SwaggerModule.loadPluginMetadata(metadata);

  const config = new DocumentBuilder()
    .setTitle('Rush Hour REST API')
    .setVersion('1.0.0')
    .build();
  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (_: string, methodKey: string) => methodKey,
  });

  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs/json',
    yamlDocumentUrl: 'docs/yaml',
  });

  await app.listen(configService.get('API_PORT') ?? 3000);
}
bootstrap();
