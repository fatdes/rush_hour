import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { SolverController } from './solver.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ClientsModule.registerAsync({
      clients: [
        {
          name: 'KAFKA_SERVICE',
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: async (configService: ConfigService) => ({
            transport: Transport.KAFKA,
            options: {
              client: {
                clientId: 'solver',
                brokers: [
                  `${configService.get('KAFKA_HOST') ?? 'localhost'}:${configService.get('KAFKA_PORT') ?? '9092'}`,
                ],
              },
              producer: {
                retry: {
                  retries: 5,
                },
              },
              producerOnlyMode: true,
            },
          }),
        },
      ],
    }),
  ],
  controllers: [SolverController],
  providers: [],
})
export class SolverModule {}
