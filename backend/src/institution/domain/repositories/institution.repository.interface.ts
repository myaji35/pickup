import { Institution } from '../entities/institution.entity';

/**
 * IInstitutionRepository Interface
 * 기관 Repository의 계약 정의
 * Infrastructure 레이어에서 구현됨
 */
export interface IInstitutionRepository {
  /**
   * ID로 기관 조회 (기관 유형 포함)
   */
  findById(id: string): Promise<Institution | null>;

  /**
   * 사업자등록번호로 기관 조회
   */
  findByBusinessRegistrationNo(businessRegistrationNo: string): Promise<Institution | null>;

  /**
   * 기관 생성
   */
  create(institution: Institution): Promise<Institution>;

  /**
   * 기관 업데이트 (유형 변경 포함)
   */
  update(institution: Institution): Promise<Institution>;

  /**
   * 기관 삭제
   */
  delete(id: string): Promise<void>;
}
