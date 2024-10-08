import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger } from 'nestjs-pino';
import { SolverModule } from './solver.module';

async function bootstrap() {
  const app = await NestFactory.create(SolverModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));
  app.flushLogs();

  const configService = app.get(ConfigService);
  const ms = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'solver',
        brokers: [
          `${configService.get('KAFKA_HOST') ?? 'localhost'}:${configService.get('KAFKA_PORT') ?? 9092}`,
        ],
      },
      consumer: {
        groupId: 'solver',
      },
    },
  });

  await app.startAllMicroservices();
  await ms.listen();
  await ms.close();
  await app.close();
}
bootstrap();
