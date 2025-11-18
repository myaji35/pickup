/**
 * T406: InstitutionType Type Definitions
 * 기관 유형 관련 타입 정의
 */

export interface InstitutionType {
  id: string;
  typeCode: string; // DAYCARE, GENERAL
  typeName: string; // 주간보호, 일반
  minimumCareTimeHours: number | null; // 8 for DAYCARE, null for GENERAL
  createdAt: string;
  updatedAt: string;
}
