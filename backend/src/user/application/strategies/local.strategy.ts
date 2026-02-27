import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../services/auth.service';
import { User } from '../../domain/entities/user.entity';

/**
 * Local Strategy (Phase 11)
 * 이메일/비밀번호 로그인 전략
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email', // default는 'username'이지만 우리는 email 사용
      passwordField: 'password',
    });
  }

  /**
   * Passport가 자동으로 호출
   * - email, password를 받아서 검증
   */
  async validate(email: string, password: string): Promise<User> {
    const user = await this.authService.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }
}
