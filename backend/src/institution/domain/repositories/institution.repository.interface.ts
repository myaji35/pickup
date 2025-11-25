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
   * 기관 업데이트 (유형 변경 포함, Phase 11: 상태 관리 포함)
   */
  update(institution: Institution): Promise<Institution>;

  /**
   * 기관 삭제
   */
  delete(id: string): Promise<void>;

  /**
   * T441: 상태별 기관 조회
   * Phase 11: PENDING, ACTIVE, SUSPENDED, INACTIVE 필터링
   */
  findByStatus(status: string): Promise<Institution[]>;

  /**
   * T442: 승인 대기 회원사 조회
   * Phase 11: PENDING 상태의 회원사만 반환
   */
  findPendingInstitutions(): Promise<Institution[]>;

  /**
   * Phase 11: 모든 기관 조회 (페이지네이션 지원)
   */
  findAll(options?: { skip?: number; take?: number; status?: string }): Promise<Institution[]>;

  /**
   * Phase 11: 기관 수 카운트 (상태별 필터 지원)
   */
  count(status?: string): Promise<number>;
}
