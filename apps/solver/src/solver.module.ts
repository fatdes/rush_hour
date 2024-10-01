import { Module, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { LoggerModule } from 'nestjs-pino';
import { SolverController } from './solver.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        return {
          pinoHttp: {
            level: config.get('LOG_LEVEL') ?? 'debug',
            transport:
              (config.get('LOG_FORMAT') ?? 'json' !== 'json')
                ? {
                    target: 'pino-pretty',
                    options: {
                      colorize: true,
                      colorizeObjects: true,
                      singleLine: true,
                      ignore: 'reqId,req.headers,req.remotePort,pid,hostname,res.headers,context',
                    },
                  }
                : undefined,
            autoLogging: false,
          },
          exclude: [
            {
              method: RequestMethod.ALL,
              path: 'health',
            },
          ],
        };
      },
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
