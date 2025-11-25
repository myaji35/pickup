import { IsNotEmpty, IsString, IsNumber, IsOptional, IsObject, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Phase 11: CreatePlanDto
 *
 * 요금제 생성 요청 DTO (Admin용)
 */
export class CreatePlanDto {
  @ApiProperty({
    description: '요금제명',
    example: '스타터',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: '요금제 코드 (고유)',
    example: 'STARTER',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({
    description: '최대 차량 수 (null = 무제한)',
    example: 3,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxVehicles: number | null;

  @ApiPropertyOptional({
    description: '최대 승객 수 (null = 무제한)',
    example: 30,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPassengers: number | null;

  @ApiProperty({
    description: '월 요금 (원)',
    example: 50000,
  })
  @IsNumber()
  @Min(0)
  monthlyPrice: number;

  @ApiProperty({
    description: '기능 플래그 (JSON)',
    example: {
      csvUpload: true,
      analytics: false,
      aiOptimization: false,
      apiAccess: false,
      prioritySupport: false,
    },
  })
  @IsObject()
  features: any;
}
