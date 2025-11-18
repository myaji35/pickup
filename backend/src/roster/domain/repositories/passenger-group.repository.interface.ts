import { PassengerGroup } from '../entities/passenger-group.entity';

/**
 * PassengerGroup Repository Interface
 * DDD의 Repository Pattern - 도메인 레이어는 인프라 구현에 의존하지 않음
 */
export interface IPassengerGroupRepository {
  /**
   * 새로운 승객 그룹 생성
   */
  create(group: Omit<PassengerGroup, 'id' | 'createdAt' | 'updatedAt'>): Promise<PassengerGroup>;

  /**
   * 승객과 함께 그룹 생성 (트랜잭션)
   */
  createWithPassengers(
    group: Omit<PassengerGroup, 'id' | 'createdAt' | 'updatedAt'>,
    passengerIds: string[],
  ): Promise<PassengerGroup>;

  /**
   * 기관의 모든 그룹 조회
   */
  findAll(institutionId: string): Promise<PassengerGroup[]>;

  /**
   * ID로 그룹 조회 (승객 포함)
   */
  findById(id: string): Promise<PassengerGroup | null>;

  /**
   * 그룹 코드로 조회 (중복 검사용)
   */
  findByGroupCode(institutionId: string, groupCode: string): Promise<PassengerGroup | null>;

  /**
   * 그룹 정보 업데이트
   */
  update(id: string, data: Partial<Pick<PassengerGroup, 'name'>>): Promise<PassengerGroup>;

  /**
   * 그룹 삭제
   */
  delete(id: string): Promise<void>;

  /**
   * 승객 수 업데이트 (승객 추가/제거 시 자동 호출)
   */
  updateTotalPassengerCount(id: string, count: number): Promise<void>;
}
