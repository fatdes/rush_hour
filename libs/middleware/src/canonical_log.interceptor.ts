import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { storage, Store } from 'nestjs-pino/storage';
import { finalize, Observable } from 'rxjs';

@Injectable()
export class CanonicalLogInterceptor implements NestInterceptor {
  constructor(
    @InjectPinoLogger(CanonicalLogInterceptor.name)
    private readonly logger: PinoLogger,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const h = context.getHandler();

    if (h.name.startsWith('handle')) {
      // https://github.com/iamolegga/nestjs-pino/issues/803
      // https://github.com/nestjs/nest/issues/1627#issuecomment-951645320
      storage.enterWith(new Store(this.logger.logger));
    }

    return next.handle().pipe(
      finalize(() => {
        // it's not http
        if (h.name.startsWith('handle')) {
          this.logger.info(`${h.name} completed`);
          return;
        }

        const res = context.switchToHttp().getResponse();
        res?.on('finish', () => {
          this.logger.info({ res }, `${h.name} completed`);
        });
      }),
    );
  }
}
