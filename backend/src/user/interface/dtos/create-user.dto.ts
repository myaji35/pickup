import { IsEmail, IsNotEmpty, IsString, IsOptional, IsEnum, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Phase 11: CreateUserDto
 *
 * 사용자 생성 요청 DTO (Admin용)
 */
export class CreateUserDto {
  @ApiProperty({
    description: '이메일',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: '비밀번호 (8자 이상)',
    example: 'password123',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty({
    description: '사용자 역할',
    enum: ['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'DRIVER'],
  })
  @IsEnum(['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'DRIVER'])
  role: string;

  @ApiProperty({
    description: '이름',
    example: '홍길동',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: '소속 회원사 ID (INSTITUTION_ADMIN, DRIVER인 경우 필수)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsString()
  institutionId?: string;
}
