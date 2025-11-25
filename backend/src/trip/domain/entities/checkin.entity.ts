/**
 * CheckIn Entity (Phase 12)
 *
 * 체크인 도메인 엔티티
 * 승객의 탑승/하차 기록을 관리
 */

import { GpsLocation } from './trip.entity';

export enum CheckInType {
  BOARDING = 'BOARDING', // 탑승
  ALIGHTING = 'ALIGHTING', // 하차
}

export class CheckIn {
  constructor(
    public readonly id: string,
    public readonly tripId: string,
    public readonly passengerId: string,
    public readonly type: CheckInType,
    public readonly timestamp: Date,
    public readonly location: GpsLocation,
    public readonly createdAt: Date,
  ) {}

  /**
   * 탑승 체크인인지 확인
   */
  isBoarding(): boolean {
    return this.type === CheckInType.BOARDING;
  }

  /**
   * 하차 체크인인지 확인
   */
  isAlighting(): boolean {
    return this.type === CheckInType.ALIGHTING;
  }
}
