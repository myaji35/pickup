import { Plan } from '../entities/plan.entity';

/**
 * T447: IPlanRepository Interface
 *
 * Phase 11: 요금제 Repository 계약
 */
export interface IPlanRepository {
  /**
   * ID로 요금제 조회
   */
  findById(id: string): Promise<Plan | null>;

  /**
   * 코드로 요금제 조회
   */
  findByCode(code: string): Promise<Plan | null>;

  /**
   * 모든 요금제 조회 (활성 필터 지원)
   */
  findAll(isActiveOnly?: boolean): Promise<Plan[]>;

  /**
   * 요금제 생성
   */
  create(plan: Plan): Promise<Plan>;

  /**
   * 요금제 업데이트
   */
  update(plan: Plan): Promise<Plan>;

  /**
   * 요금제 삭제 (Soft Delete)
   */
  delete(id: string): Promise<void>;
}
