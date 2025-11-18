import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsOptional, IsArray } from 'class-validator';

/**
 * Create Passenger Group DTO
 * HTTP 요청 검증 및 Swagger 문서화
 */
export class CreatePassengerGroupDto {
  @ApiProperty({
    description: '기관 ID',
    example: 'inst-123',
  })
  @IsString()
  @IsNotEmpty()
  institutionId: string;

  @ApiProperty({
    description: '그룹 코드 (1-20자, 기관 내 고유)',
    example: 'GRP001',
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  groupCode: string;

  @ApiProperty({
    description: '그룹 이름',
    example: 'Morning Group A',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: '초기 승객 ID 목록 (선택)',
    example: ['passenger-1', 'passenger-2'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  passengerIds?: string[];
}
