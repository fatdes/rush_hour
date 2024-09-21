import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { SolverModule } from './solver.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const ms = await NestFactory.createMicroservice<MicroserviceOptions>(
    SolverModule,
    {
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: 'solver',
          brokers: [
            `${configService.get('KAFKA_HOST') ?? 'kafka'}:${configService.get('KAFKA_PORT') ?? 9094}`,
          ],
        },
        consumer: {
          groupId: 'solver',
        },
      },
    },
  );
  await ms.listen();

  await app.close();
}
bootstrap();
