/**
 * End Trip DTO (Phase 12)
 */

import { IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { GpsLocationDto } from './start-trip.dto';

export class EndTripDto {
  @ValidateNested()
  @Type(() => GpsLocationDto)
  @IsNotEmpty()
  endLocation: GpsLocationDto;
}
