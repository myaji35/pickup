import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

/**
 * Institution Registration DTO
 * 기관 회원가입용 DTO (기관 정보 + 관리자 계정 정보)
 */
export class RegisterInstitutionDto {
  // Institution Info
  @ApiProperty({
    description: '사업자 등록번호 (하이픈 제외 10자리)',
    example: '1234567890',
  })
  @IsString()
  businessRegistrationNumber: string;

  @ApiProperty({
    description: '기관명',
    example: '서울 어린이집',
  })
  @IsString()
  institutionName: string;

  // Admin User Info
  @ApiProperty({
    description: '관리자 이메일',
    example: 'admin@example.com',
  })
  @IsEmail()
  adminEmail: string;

  @ApiProperty({
    description: '관리자 비밀번호 (최소 8자)',
    example: 'Password123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  adminPassword: string;

  @ApiProperty({
    description: '관리자 이름',
    example: '홍길동',
  })
  @IsString()
  adminName: string;
}
