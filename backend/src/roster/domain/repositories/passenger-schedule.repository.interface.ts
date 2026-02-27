import { PassengerSchedule } from '../entities/passenger-schedule.entity';

/**
 * IPassengerScheduleRepository Interface
 * PassengerSchedule Repository의 계약 정의
 * Infrastructure 레이어에서 구현됨
 */
export interface IPassengerScheduleRepository {
  /**
   * T348: 스케줄 생성 또는 업데이트 (passengerId 기준)
   */
  upsert(schedule: PassengerSchedule): Promise<PassengerSchedule>;

  /**
   * T350: passengerId로 스케줄 조회
   */
  findByPassengerId(passengerId: string): Promise<PassengerSchedule | null>;

  /**
   * T349: 스케줄 삭제
   */
  delete(passengerId: string): Promise<void>;
}
