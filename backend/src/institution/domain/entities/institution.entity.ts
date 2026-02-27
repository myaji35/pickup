/**
 * T394: Institution Entity
 *
 * 기관 엔티티 (B2B 고객)
 * - 사업자등록번호로 식별
 * - 기관 유형 연결 (DAYCARE, GENERAL 등)
 * - Phase 11: 상태 관리 (PENDING, ACTIVE, SUSPENDED, INACTIVE)
 */

export type InstitutionStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';

export class Institution {
  readonly id: string;
  readonly businessRegistrationNo: string;
  name: string;
  institutionTypeId: string | null; // T395: 기관 유형 ID
  status: InstitutionStatus; // Phase 11: 상태 관리
  rejectionReason: string | null; // Phase 11: 거부 사유
  approvedAt: Date | null; // Phase 11: 승인 일시
  approvedBy: string | null; // Phase 11: 승인자 (User ID)
  suspendedAt: Date | null; // Phase 11: 정지 일시
  suspensionReason: string | null; // Phase 11: 정지 사유
  readonly createdAt: Date;
  updatedAt: Date;

  constructor(props: {
    id: string;
    businessRegistrationNo: string;
    name: string;
    institutionTypeId: string | null;
    status?: InstitutionStatus;
    rejectionReason?: string | null;
    approvedAt?: Date | null;
    approvedBy?: string | null;
    suspendedAt?: Date | null;
    suspensionReason?: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    // Validation
    if (!props.businessRegistrationNo || props.businessRegistrationNo.trim() === '') {
      throw new Error('businessRegistrationNo cannot be empty');
    }

    if (!props.name || props.name.trim() === '') {
      throw new Error('name cannot be empty');
    }

    this.id = props.id;
    this.businessRegistrationNo = props.businessRegistrationNo;
    this.name = props.name;
    this.institutionTypeId = props.institutionTypeId;
    this.status = props.status || 'PENDING';
    this.rejectionReason = props.rejectionReason || null;
    this.approvedAt = props.approvedAt || null;
    this.approvedBy = props.approvedBy || null;
    this.suspendedAt = props.suspendedAt || null;
    this.suspensionReason = props.suspensionReason || null;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /**
   * Phase 11: 회원사 승인
   */
  approve(approvedBy: string): void {
    if (this.status !== 'PENDING') {
      throw new Error(`Cannot approve institution with status ${this.status}`);
    }

    this.status = 'ACTIVE';
    this.approvedBy = approvedBy;
    this.approvedAt = new Date();
    this.rejectionReason = null;
    this.updatedAt = new Date();
  }

  /**
   * Phase 11: 회원사 거부
   */
  reject(reason: string): void {
    if (this.status !== 'PENDING') {
      throw new Error(`Cannot reject institution with status ${this.status}`);
    }

    if (!reason || reason.trim() === '') {
      throw new Error('Rejection reason is required');
    }

    this.status = 'INACTIVE';
    this.rejectionReason = reason;
    this.updatedAt = new Date();
  }

  /**
   * Phase 11: 회원사 정지
   */
  suspend(reason: string): void {
    if (this.status !== 'ACTIVE') {
      throw new Error(`Cannot suspend institution with status ${this.status}`);
    }

    if (!reason || reason.trim() === '') {
      throw new Error('Suspension reason is required');
    }

    this.status = 'SUSPENDED';
    this.suspensionReason = reason;
    this.suspendedAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Phase 11: 회원사 재활성화
   */
  reactivate(): void {
    if (this.status !== 'SUSPENDED') {
      throw new Error(`Cannot reactivate institution with status ${this.status}`);
    }

    this.status = 'ACTIVE';
    this.suspensionReason = null;
    this.suspendedAt = null;
    this.updatedAt = new Date();
  }

  /**
   * 상태 확인 헬퍼 메서드
   */
  isPending(): boolean {
    return this.status === 'PENDING';
  }

  isActive(): boolean {
    return this.status === 'ACTIVE';
  }

  isSuspended(): boolean {
    return this.status === 'SUSPENDED';
  }

  isInactive(): boolean {
    return this.status === 'INACTIVE';
  }

  /**
   * T395: 기관 유형 업데이트
   */
  updateInstitutionType(institutionTypeId: string | null): void {
    this.institutionTypeId = institutionTypeId;
    this.updatedAt = new Date();
  }

  /**
   * 기관 이름 업데이트
   */
  updateName(name: string): void {
    if (!name || name.trim() === '') {
      throw new Error('name cannot be empty');
    }

    this.name = name;
    this.updatedAt = new Date();
  }
}
