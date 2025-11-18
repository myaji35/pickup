import { Vehicle } from '../entities/vehicle.entity';

/**
 * IVehicleRepository Interface
 * 차량 Repository의 계약 정의
 * Infrastructure 레이어에서 구현됨
 */
export interface IVehicleRepository {
  /**
   * 새 차량 생성
   */
  create(vehicle: Vehicle): Promise<Vehicle>;

  /**
   * 기관 내 모든 차량 조회
   */
  findAll(institutionId: string): Promise<Vehicle[]>;

  /**
   * ID로 차량 조회
   */
  findById(id: string): Promise<Vehicle | null>;

  /**
   * 기관 내 차량번호 뒤 4자리로 조회 (중복 검증용)
   */
  findByLastFourDigits(
    institutionId: string,
    lastFourDigits: string,
  ): Promise<Vehicle | null>;

  /**
   * 차량 정보 업데이트
   */
  update(vehicle: Vehicle): Promise<Vehicle>;

  /**
   * 차량 삭제
   */
  delete(id: string): Promise<void>;
}
