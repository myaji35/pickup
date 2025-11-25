import { IsOptional, IsString, IsNumber, IsObject, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Phase 11: UpdatePlanDto
 *
 * 요금제 수정 요청 DTO
 */
export class UpdatePlanDto {
  @ApiPropertyOptional({
    description: '요금제명',
    example: '스타터',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: '월 요금 (원)',
    example: 50000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyPrice?: number;

  @ApiPropertyOptional({
    description: '최대 차량 수 (null = 무제한)',
    example: 3,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxVehicles?: number | null;

  @ApiPropertyOptional({
    description: '최대 승객 수 (null = 무제한)',
    example: 30,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPassengers?: number | null;

  @ApiPropertyOptional({
    description: '기능 플래그 (JSON)',
    example: {
      csvUpload: true,
      analytics: true,
    },
  })
  @IsOptional()
  @IsObject()
  features?: any;
}
