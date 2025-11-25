import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UserRepository } from '../../infrastructure/persistence/user.repository';
import { User, UserRole } from '../../domain/entities/user.entity';

export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: UserRole;
  institutionId: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  institutionId?: string;
}

/**
 * Authentication Service (Phase 11)
 * JWT 기반 인증/인가 처리
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 사용자 등록 (회원가입)
   * - 이메일 중복 확인
   * - 비밀번호 해싱 (bcrypt)
   * - 사용자 생성
   */
  async register(dto: RegisterDto): Promise<User> {
    // 이메일 중복 확인
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // 비밀번호 해싱 (salt rounds: 10)
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // 사용자 엔티티 생성
    const user = new User(
      '', // id는 DB에서 생성
      dto.email,
      hashedPassword,
      dto.role,
      dto.name,
      true, // isActive
      dto.institutionId || null,
      null, // lastLoginAt
      new Date(),
      new Date(),
    );

    // DB에 저장
    return await this.userRepository.create(user);
  }

  /**
   * 사용자 인증 (로그인)
   * - 이메일/비밀번호 검증
   * - JWT 토큰 발급
   */
  async login(email: string, password: string): Promise<AuthTokens> {
    // 사용자 조회
    const user = await this.validateUser(email, password);

    // 마지막 로그인 시간 기록
    user.recordLogin();
    await this.userRepository.update(user.id, { lastLoginAt: user.lastLoginAt });

    // JWT 토큰 생성
    return this.generateTokens(user);
  }

  /**
   * 사용자 검증 (이메일/비밀번호)
   */
  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is deactivated');
    }

    // 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  /**
   * JWT 토큰 생성 (Access + Refresh)
   */
  async generateTokens(user: User): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      institutionId: user.institutionId,
    };

    const accessSecret = this.configService.get<string>('JWT_ACCESS_SECRET') || 'default-access-secret';
    const accessExpiresIn = this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m';
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || 'default-refresh-secret';
    const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: accessExpiresIn as any,
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: refreshExpiresIn as any,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh Token으로 새 Access Token 발급
   */
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      // 사용자 존재 여부 확인
      const user = await this.userRepository.findById(payload.sub);
      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // 새 Access Token 발급
      const newPayload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        institutionId: user.institutionId,
      };

      const accessSecret = this.configService.get<string>('JWT_ACCESS_SECRET') || 'default-access-secret';
      const accessExpiresIn = this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m';

      const accessToken = await this.jwtService.signAsync(newPayload, {
        secret: accessSecret,
        expiresIn: accessExpiresIn as any,
      });

      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * JWT 토큰 검증
   */
  async verifyAccessToken(token: string): Promise<JwtPayload> {
    try {
      return this.jwtService.verify<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid access token');
    }
  }
}
