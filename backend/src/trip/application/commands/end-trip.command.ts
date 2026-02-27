/**
 * End Trip Command (Phase 12)
 *
 * 운행 종료 커맨드
 */

import { GpsLocation } from '../../domain/entities/trip.entity';

export class EndTripCommand {
  constructor(
    public readonly tripId: string,
    public readonly driverId: string, // 인증된 기사 ID
    public readonly endLocation: GpsLocation,
  ) {}
}
