/**
 * Roles Decorator (Phase 12)
 * Marks endpoints with required role(s)
 */

import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
