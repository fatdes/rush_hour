import { LoggerModuleParams } from '@app/middleware';
import { Module } from '@nestjs/common';
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
      useFactory: LoggerModuleParams,
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [],
  providers: [JanitorService],
})
export class JanitorModule {}
