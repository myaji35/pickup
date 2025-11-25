/**
 * Start Trip DTO (Phase 12)
 */

import { IsNotEmpty, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class GpsLocationDto {
  @IsNumber()
  @IsNotEmpty()
  lat: number;

  @IsNumber()
  @IsNotEmpty()
  lng: number;
}

export class StartTripDto {
  @ValidateNested()
  @Type(() => GpsLocationDto)
  @IsNotEmpty()
  startLocation: GpsLocationDto;
}
