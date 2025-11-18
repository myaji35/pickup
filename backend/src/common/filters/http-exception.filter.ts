import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * HTTP 예외 처리 필터
 * 모든 HTTP 예외를 표준화된 형식으로 응답
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // 예외 응답 파싱
    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any).message || 'Internal server error';

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: Array.isArray(message) ? message : [message],
      error:
        typeof exceptionResponse === 'object' && 'error' in exceptionResponse
          ? exceptionResponse.error
          : HttpStatus[status],
    };

    // 에러 로깅 (500번대 에러만 상세 로그)
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception.stack,
        'HttpExceptionFilter',
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} - ${status}: ${JSON.stringify(message)}`,
      );
    }

    response.status(status).json(errorResponse);
  }
}
