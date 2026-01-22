/**
 * Optimize Route DTO
 */

import { IsString, IsDateString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ShuttleType } from '../../domain/entities/route.entity';

export class OptimizeRouteDto {
  @ApiProperty({
    description: '기관 ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  institutionId: string;

  @ApiProperty({
    description: '차량 ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsString()
  vehicleId: string;

  @ApiProperty({
    description: '경로 날짜',
    example: '2025-01-15',
  })
  @IsDateString()
  routeDate: string;

  @ApiProperty({
    description: '셔틀 타입',
    enum: ShuttleType,
    example: ShuttleType.MORNING,
  })
  @IsEnum(ShuttleType)
  shuttleType: ShuttleType;

  @ApiProperty({
    description: '평균 속도 (km/h, 기본값: 30)',
    example: 30,
    required: false,
  })
  @IsOptional()
  averageSpeed?: number;
}
