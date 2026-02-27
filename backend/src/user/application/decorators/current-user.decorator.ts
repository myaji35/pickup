import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';

/**
 * @CurrentUser() Decorator (Phase 11)
 * 요청에서 현재 로그인한 사용자 정보 추출
 *
 * Usage:
 * async getProfile(@CurrentUser() user: User) { ... }
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
