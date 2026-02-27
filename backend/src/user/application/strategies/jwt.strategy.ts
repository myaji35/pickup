import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserRepository } from '../../infrastructure/persistence/user.repository';
import { JwtPayload } from '../services/auth.service';
import { User } from '../../domain/entities/user.entity';

/**
 * JWT Strategy (Phase 11)
 * Access Token 검증 전략
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly userRepository: UserRepository,
  ) {
    const secret = configService.get<string>('JWT_ACCESS_SECRET') || 'default-access-secret';
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret as string,
    });
  }

  /**
   * JWT 토큰이 유효할 때 호출됨
   * - 사용자 존재 여부 확인
   * - 사용자 활성 상태 확인
   */
  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.userRepository.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is deactivated');
    }

    return user;
  }
}
