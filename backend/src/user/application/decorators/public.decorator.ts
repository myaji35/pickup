import { SetMetadata } from '@nestjs/common';

/**
 * @Public() Decorator (Phase 11)
 * 인증이 필요없는 Public 엔드포인트 표시
 * JwtAuthGuard가 이 메타데이터를 확인하여 인증 스킵
 *
 * Usage:
 * @Public()
 * @Post('login')
 * async login() { ... }
 */
export const Public = () => SetMetadata('isPublic', true);
