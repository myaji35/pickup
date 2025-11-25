import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../domain/entities/user.entity';

/**
 * 인증 토큰 응답 DTO (Phase 11)
 */
export class AuthTokensResponseDto {
  @ApiProperty({
    description: 'Access Token (15분 유효)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Refresh Token (7일 유효)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;
}

/**
 * 사용자 정보 응답 DTO (Phase 11)
 */
export class UserResponseDto {
  @ApiProperty({ description: '사용자 ID', example: 'uuid-123' })
  id: string;

  @ApiProperty({ description: '이메일', example: 'admin@example.com' })
  email: string;

  @ApiProperty({ description: '이름', example: '홍길동' })
  name: string;

  @ApiProperty({
    description: '역할',
    enum: ['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'DRIVER'],
    example: 'INSTITUTION_ADMIN',
  })
  role: UserRole;

  @ApiProperty({ description: '활성 상태', example: true })
  isActive: boolean;

  @ApiProperty({
    description: '소속 기관 ID',
    example: 'inst-uuid-123',
    nullable: true,
  })
  institutionId: string | null;

  @ApiProperty({ description: '마지막 로그인', nullable: true })
  lastLoginAt: Date | null;

  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  @ApiProperty({ description: '수정일' })
  updatedAt: Date;

  static fromDomain(user: any): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      institutionId: user.institutionId,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
