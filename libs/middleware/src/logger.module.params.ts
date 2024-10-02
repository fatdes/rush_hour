import { RequestMethod } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Params } from 'nestjs-pino';
import { ulid } from 'ulidx';

export async function LoggerModuleParams(
  config: ConfigService,
): Promise<Params> {
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
                translateTime: 'SYS:isoDateTime',
                ignore:
                  'reqId,req.headers,req.remotePort,pid,hostname,res.headers,context',
              },
            }
          : undefined,
      genReqId(req) {
        return req.headers['request-id'] ?? ulid();
      },
      autoLogging: false,
    },
    exclude: [
      {
        method: RequestMethod.ALL,
        path: 'health',
      },
      {
        method: RequestMethod.ALL,
        path: 'docs',
      },
    ],
  };
}
