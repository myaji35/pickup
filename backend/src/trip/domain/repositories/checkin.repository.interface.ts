/**
 * CheckIn Repository Interface (Phase 12)
 *
 * 체크인 저장소 인터페이스
 */

import { CheckIn, CheckInType } from '../entities/checkin.entity';

export interface ICheckInRepository {
  /**
   * 체크인 생성
   */
  create(checkIn: CheckIn): Promise<CheckIn>;

  /**
   * ID로 체크인 조회
   */
  findById(id: string): Promise<CheckIn | null>;

  /**
   * 운행의 모든 체크인 조회
   */
  findByTrip(tripId: string): Promise<CheckIn[]>;

  /**
   * 운행의 특정 타입 체크인 조회
   */
  findByTripAndType(tripId: string, type: CheckInType): Promise<CheckIn[]>;

  /**
   * 승객의 체크인 기록 조회
   */
  findByPassenger(
    passengerId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<CheckIn[]>;

  /**
   * 특정 승객의 특정 운행 체크인 조회
   */
  findByTripAndPassenger(
    tripId: string,
    passengerId: string,
  ): Promise<CheckIn[]>;

  /**
   * 체크인 존재 여부 확인
   */
  exists(tripId: string, passengerId: string, type: CheckInType): Promise<boolean>;

  /**
   * 운행의 체크인 카운트
   */
  countByTrip(tripId: string): Promise<number>;

  /**
   * 운행의 탑승 체크인 카운트
   */
  countBoardingByTrip(tripId: string): Promise<number>;
}

export const CHECKIN_REPOSITORY = Symbol('ICheckInRepository');
