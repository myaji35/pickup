import { InstitutionType } from '../entities/institution-type.entity';

/**
 * T377: IInstitutionTypeRepository Interface
 * 기관 유형 Repository의 계약 정의
 * Infrastructure 레이어에서 구현됨
 */
export interface IInstitutionTypeRepository {
  /**
   * 모든 기관 유형 조회
   */
  findAll(): Promise<InstitutionType[]>;

  /**
   * ID로 기관 유형 조회
   */
  findById(id: string): Promise<InstitutionType | null>;

  /**
   * 새 기관 유형 생성 (시스템 관리자 전용, 또는 seed data)
   */
  create(institutionType: InstitutionType): Promise<InstitutionType>;
}
