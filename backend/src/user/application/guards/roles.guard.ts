import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../domain/entities/user.entity';
import { User } from '../../domain/entities/user.entity';

/**
 * Roles Guard (Phase 11)
 * 역할 기반 접근 제어 가드
 * - @Roles() 데코레이터로 지정된 역할 검증
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // @Roles() 데코레이터로 지정된 역할 가져오기
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    // 역할이 지정되지 않으면 통과
    if (!requiredRoles) {
      return true;
    }

    // 요청에서 사용자 정보 가져오기 (JwtAuthGuard가 설정)
    const request = context.switchToHttp().getRequest();
    const user: User = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // 사용자 역할이 필요한 역할에 포함되는지 확인
    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new ForbiddenException(`Access denied. Required roles: ${requiredRoles.join(', ')}`);
    }

    return true;
  }
}
