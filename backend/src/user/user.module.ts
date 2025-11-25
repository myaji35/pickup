import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';

// Infrastructure
import { UserRepository } from './infrastructure/persistence/user.repository';

// Application
import { AuthService } from './application/services/auth.service';
import { JwtStrategy } from './application/strategies/jwt.strategy';
import { LocalStrategy } from './application/strategies/local.strategy';
import { JwtAuthGuard } from './application/guards/jwt-auth.guard';
import { RolesGuard } from './application/guards/roles.guard';

// Interface
import { AuthController } from './interface/controllers/auth.controller';
import { AdminUserController } from './interface/controllers/admin-user.controller';

/**
 * User Module (Phase 11)
 * 사용자 인증/인가 모듈
 */
@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_ACCESS_SECRET') || 'default-secret-key';
        const expiresIn = configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m';
        return {
          secret,
          signOptions: {
            expiresIn: expiresIn as any,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController, AdminUserController],
  providers: [
    // Repository
    UserRepository,
    // Services
    AuthService,
    // Strategies
    JwtStrategy,
    LocalStrategy,
    // Guards
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [
    AuthService,
    UserRepository,
    JwtAuthGuard,
    RolesGuard,
  ],
})
export class UserModule {}
