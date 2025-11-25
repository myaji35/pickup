/**
 * Start Trip Command (Phase 12)
 *
 * 운행 시작 커맨드
 */

import { GpsLocation } from '../../domain/entities/trip.entity';

export class StartTripCommand {
  constructor(
    public readonly tripId: string,
    public readonly driverId: string, // 인증된 기사 ID
    public readonly startLocation: GpsLocation,
  ) {}
}
