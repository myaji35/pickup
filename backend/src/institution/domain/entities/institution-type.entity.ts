/**
 * T375: InstitutionType Entity
 *
 * 기관 유형 엔티티
 * - 주간보호 (DAYCARE): minimumCareTimeHours = 8
 * - 일반 (GENERAL): minimumCareTimeHours = null (검증 없음)
 */
export class InstitutionType {
  readonly id: string;
  readonly typeCode: string;
  readonly typeName: string;
  readonly minimumCareTimeHours: number | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: {
    id: string;
    typeCode: string;
    typeName: string;
    minimumCareTimeHours: number | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    // T376: Validation logic
    if (!props.typeCode || props.typeCode.trim() === '') {
      throw new Error('typeCode cannot be empty');
    }

    if (!props.typeName || props.typeName.trim() === '') {
      throw new Error('typeName cannot be empty');
    }

    if (props.minimumCareTimeHours !== null && props.minimumCareTimeHours < 0) {
      throw new Error('minimumCareTimeHours must be non-negative');
    }

    this.id = props.id;
    this.typeCode = props.typeCode;
    this.typeName = props.typeName;
    this.minimumCareTimeHours = props.minimumCareTimeHours;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /**
   * T376: 케어 시간 검증이 필요한지 여부
   */
  requiresCareTimeValidation(): boolean {
    return this.minimumCareTimeHours !== null;
  }
}
