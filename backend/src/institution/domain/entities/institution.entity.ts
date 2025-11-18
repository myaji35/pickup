/**
 * T394: Institution Entity
 *
 * 기관 엔티티 (B2B 고객)
 * - 사업자등록번호로 식별
 * - 기관 유형 연결 (DAYCARE, GENERAL 등)
 */
export class Institution {
  readonly id: string;
  readonly businessRegistrationNo: string;
  name: string;
  institutionTypeId: string | null; // T395: 기관 유형 ID
  readonly createdAt: Date;
  updatedAt: Date;

  constructor(props: {
    id: string;
    businessRegistrationNo: string;
    name: string;
    institutionTypeId: string | null;
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
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
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
