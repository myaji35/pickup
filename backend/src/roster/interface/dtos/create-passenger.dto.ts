import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional, Matches } from 'class-validator';

/**
 * Create Passenger DTO
 * HTTP 요청 검증 및 Swagger 문서화
 */
export class CreatePassengerDto {
  @ApiProperty({
    description: '기관 ID',
    example: 'inst-123',
  })
  @IsString()
  @IsNotEmpty()
  institutionId: string;

  @ApiProperty({
    description: '승객 이름',
    example: '홍길동',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: '전화번호 (한국 형식)',
    example: '010-1234-5678',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^01[016789]-?\d{3,4}-?\d{4}$/, {
    message: 'Invalid Korean phone number format',
  })
  phoneNumber: string;

  @ApiProperty({
    description: '픽업 주소',
    example: '서울시 강남구 테헤란로 123',
  })
  @IsString()
  @IsNotEmpty()
  pickupAddress: string;

  @ApiProperty({
    description: '드랍오프 주소',
    example: '서울시 서초구 서초대로 456',
  })
  @IsString()
  @IsNotEmpty()
  dropoffAddress: string;

  @ApiProperty({
    description: '셔틀 타입',
    enum: ['MORNING', 'EVENING', 'TEMPORARY'],
    example: 'MORNING',
  })
  @IsEnum(['MORNING', 'EVENING', 'TEMPORARY'])
  shuttleType: 'MORNING' | 'EVENING' | 'TEMPORARY';

  @ApiPropertyOptional({
    description: '배정할 그룹 ID (선택)',
    example: 'group-123',
  })
  @IsOptional()
  @IsString()
  groupId?: string | null;
}
