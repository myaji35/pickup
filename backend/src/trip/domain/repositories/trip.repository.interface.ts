/**
 * Trip Repository Interface (Phase 12)
 *
 * 운행 저장소 인터페이스
 * DDD 패턴에 따라 Domain Layer에 정의하고 Infrastructure Layer에서 구현
 */

import { Trip, TripStatus, TripType } from '../entities/trip.entity';

export interface ITripRepository {
  /**
   * 운행 생성
   */
  create(trip: Trip): Promise<Trip>;

  /**
   * ID로 운행 조회
   */
  findById(id: string): Promise<Trip | null>;

  /**
   * 운행 업데이트
   */
  update(id: string, trip: Partial<Trip>): Promise<Trip>;

  /**
   * 운행 삭제
   */
  delete(id: string): Promise<void>;

  /**
   * 기사의 특정 날짜 운행 목록 조회
   */
  findByDriverAndDate(
    driverId: string,
    date: Date,
  ): Promise<Trip[]>;

  /**
   * 회원사의 특정 날짜 운행 목록 조회
   */
  findByInstitutionAndDate(
    institutionId: string,
    date: Date,
  ): Promise<Trip[]>;

  /**
   * 차량의 특정 날짜 운행 목록 조회
   */
  findByVehicleAndDate(
    vehicleId: string,
    date: Date,
  ): Promise<Trip[]>;

  /**
   * 기사의 진행 중인 운행 조회
   */
  findInProgressByDriver(driverId: string): Promise<Trip | null>;

  /**
   * 특정 상태의 운행 목록 조회
   */
  findByStatus(
    institutionId: string,
    status: TripStatus,
    limit?: number,
  ): Promise<Trip[]>;

  /**
   * 운행 존재 여부 확인
   */
  exists(id: string): Promise<boolean>;
}

export const TRIP_REPOSITORY = Symbol('ITripRepository');
