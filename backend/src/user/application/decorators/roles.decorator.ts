import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../domain/entities/user.entity';

/**
 * @Roles() Decorator (Phase 11)
 * 특정 역할만 접근 가능하도록 지정
 *
 * Usage:
 * @Roles(UserRole.SUPER_ADMIN)
 * @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
 */
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
