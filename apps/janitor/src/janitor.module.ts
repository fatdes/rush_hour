import { Module, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggerModule } from 'nestjs-pino';
import { JanitorService } from './janitor.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
                      ignore: 'reqId,req.headers,req.remotePort,pid,hostname,res.headers',
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
    ScheduleModule.forRoot(),
  ],
  controllers: [],
  providers: [JanitorService],
})
export class JanitorModule {}
