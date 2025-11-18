import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Min, Max, Matches, IsOptional } from 'class-validator';

/**
 * CreateVehicleDto
 * 차량 생성 요청 DTO
 */
export class CreateVehicleDto {
  @ApiProperty({
    description: '차량번호 뒤 4자리 (숫자만)',
    example: '1234',
    pattern: '^\\d{4}$',
  })
  @IsString()
  @Matches(/^\d{4}$/, {
    message: '차량번호는 4자리 숫자여야 합니다',
  })
  lastFourDigits: string;

  @ApiProperty({
    description: '승객 정원 (5-15명)',
    example: 10,
    minimum: 5,
    maximum: 15,
  })
  @IsNumber()
  @Min(5, { message: '승객 정원은 최소 5명이어야 합니다' })
  @Max(15, { message: '승객 정원은 최대 15명이어야 합니다' })
  passengerCapacity: number;

  @ApiProperty({
    description: '기관 ID',
    example: 'uuid-123',
  })
  @IsString()
  institutionId: string;

  @ApiProperty({
    description: '현재 배정된 승객 그룹 ID (선택사항)',
    example: 'group-uuid-456',
    required: false,
  })
  @IsOptional()
  @IsString()
  currentGroupId?: string;
}
