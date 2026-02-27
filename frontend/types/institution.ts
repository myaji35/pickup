/**
 * Institution Type Definitions
 * 기관 관련 타입 정의
 */

export interface Institution {
  id: string;
  businessRegistrationNo: string;
  name: string;
  institutionTypeId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateInstitutionInput {
  name?: string;
  institutionTypeId?: string | null;
}
