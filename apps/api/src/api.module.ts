import { BoardModule } from '@board/board';
import { CacheModule, CacheStore } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { SequelizeModule } from '@nestjs/sequelize';
import { TerminusModule } from '@nestjs/terminus';
import { redisStore } from 'cache-manager-redis-store';
import type { RedisClientOptions } from 'redis';
import { Board } from '../../../libs/board/src/board.model';
import { GMController } from './gm.controller';
import { HealthController } from './health.controller';
import { PlayerController } from './player.controller';
import { PlayerService } from './player.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SequelizeModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        dialect: configService.get('DATABASE_TYPE') ?? 'postgres',
        host: configService.get('DATABASE_HOST') ?? 'postgres',
        port: configService.get('DATABASE_PORT') ?? 5432,
        username: 'rush',
        password: 'hour',
        database: 'rush_hour',
        models: [Board],
        define: {
          underscored: true,
        },
      }),
      inject: [ConfigService],
    }),
    SequelizeModule.forFeature([Board]),
    // https://github.com/dabroek/node-cache-manager-redis-store/issues/40
    CacheModule.registerAsync<RedisClientOptions>({
      isGlobal: true,
      useFactory: async (configService: ConfigService) => {
        const store = await redisStore({
          socket: {
            host: configService.get('REDIS_HOST') ?? 'redis',
            port: configService.get('REDIS_PORT') ?? 6379,
          },
        });

        return {
          store: store as unknown as CacheStore,
          ttl: 5 * 60 * 1000, // 5 minutes
        };
      },
      inject: [ConfigService],
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
                clientId: 'api',
                brokers: [
                  `${configService.get('KAFKA_HOST') ?? 'localhost'}:${configService.get('KAFKA_PORT') ?? '9092'}`,
                ],
              },
              consumer: {
                groupId: "api",
              }
            },
          }),
        },
      ],
    }),
    TerminusModule.forRoot({
      gracefulShutdownTimeoutMs: 1000,
    }),

    // library modules
    BoardModule,
  ],
  controllers: [HealthController, GMController, PlayerController],
  providers: [PlayerService],
})
export class ApiModule {}
