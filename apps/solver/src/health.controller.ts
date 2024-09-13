import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisOptions, Transport } from '@nestjs/microservices';
import {
  HealthCheck,
  HealthCheckService,
  MicroserviceHealthIndicator,
} from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private configService: ConfigService,
    private health: HealthCheckService,
    private ms: MicroserviceHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      async () =>
        this.ms.pingCheck<RedisOptions>('redis', {
          transport: Transport.REDIS,
          options: {
            host: this.configService.get('REDIS_HOST') ?? 'localhost',
            port: this.configService.get('REDIS_PORT') ?? 6379,
          },
        }),
    ]);
  }
}
