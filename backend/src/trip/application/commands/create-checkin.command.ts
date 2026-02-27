/**
 * Create CheckIn Command (Phase 12)
 *
 * 체크인 생성 커맨드 (탑승/하차)
 */

import { CheckInType } from '../../domain/entities/checkin.entity';
import { GpsLocation } from '../../domain/entities/trip.entity';

export class CreateCheckInCommand {
  constructor(
    public readonly tripId: string,
    public readonly passengerId: string,
    public readonly type: CheckInType,
    public readonly timestamp: Date,
    public readonly location: GpsLocation,
    public readonly driverId: string, // 인증된 기사 ID
  ) {}
}
