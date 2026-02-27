import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '../../domain/entities/user.entity';

/**
 * 회원가입 DTO (Phase 11)
 */
export class RegisterDto {
  @ApiProperty({
    description: '이메일',
    example: 'admin@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: '비밀번호 (최소 8자)',
    example: 'Password123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    description: '사용자 이름',
    example: '홍길동',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: '역할',
    enum: ['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'DRIVER'],
    example: 'INSTITUTION_ADMIN',
  })
  @IsEnum(['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'DRIVER'])
  role: UserRole;

  @ApiProperty({
    description: '소속 기관 ID (SUPER_ADMIN은 불필요)',
    example: 'inst-uuid-123',
    required: false,
  })
  @IsOptional()
  @IsString()
  institutionId?: string;
}
