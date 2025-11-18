import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

/**
 * 응답 변환 인터셉터
 * 모든 성공 응답을 표준화된 형식으로 래핑
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  private readonly logger = new Logger(TransformInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    const request = context.switchToHttp().getRequest();
    const statusCode = context.switchToHttp().getResponse().statusCode;

    return next.handle().pipe(
      map((data) => {
        // 로깅 (개발 환경에서만)
        if (process.env.NODE_ENV === 'development') {
          this.logger.debug(`${request.method} ${request.url} - ${statusCode}`);
        }

        return {
          statusCode,
          message: data?.message || 'Success',
          data: data?.message ? data.data : data, // message가 있으면 data만, 없으면 전체
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
