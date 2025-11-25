/**
 * Create CheckIn DTO (Phase 12)
 */

import { IsNotEmpty, IsEnum, IsDateString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CheckInType } from '../../domain/entities/checkin.entity';
import { GpsLocationDto } from './start-trip.dto';

export class CreateCheckInDto {
  @IsUUID()
  @IsNotEmpty()
  tripId: string;

  @IsUUID()
  @IsNotEmpty()
  passengerId: string;

  @IsEnum(CheckInType)
  @IsNotEmpty()
  type: CheckInType;

  @IsDateString()
  @IsNotEmpty()
  timestamp: string; // ISO 8601 format

  @ValidateNested()
  @Type(() => GpsLocationDto)
  @IsNotEmpty()
  location: GpsLocationDto;
}
