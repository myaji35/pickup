import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, Min, Max, IsOptional, IsString } from 'class-validator';

/**
 * UpdateVehicleDto
 * 차량 정보 수정 요청 DTO
 */
export class UpdateVehicleDto {
  @ApiPropertyOptional({
    description: '승객 정원 (5-15명)',
    example: 12,
    minimum: 5,
    maximum: 15,
  })
  @IsOptional()
  @IsNumber()
  @Min(5, { message: '승객 정원은 최소 5명이어야 합니다' })
  @Max(15, { message: '승객 정원은 최대 15명이어야 합니다' })
  passengerCapacity?: number;

  @ApiPropertyOptional({
    description: '현재 배정된 승객 그룹 ID (null이면 배정 해제)',
    example: 'group-uuid-789',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  currentGroupId?: string | null;
}
