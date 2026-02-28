import { useQuery } from '@tanstack/react-query';
import { railsClient } from '@/lib/rails-client';
import { InstitutionType } from '@/types/institution-type';

export interface Institution {
  id: number;
  name: string;
  institution_type?: string;
  institutionTypeId?: string;
  status?: string;
  address?: string;
  phone?: string;
  business_number?: string;
  businessRegistrationNo?: string;
}

// Rails enum → InstitutionType 변환
const INSTITUTION_TYPES: InstitutionType[] = [
  {
    id: 'DAYCARE',
    typeCode: 'DAYCARE',
    typeName: '주간보호센터',
    minimumCareTimeHours: 8,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'GENERAL',
    typeCode: 'GENERAL',
    typeName: '일반기관',
    minimumCareTimeHours: null,
    createdAt: '',
    updatedAt: '',
  },
];

/**
 * useInstitutionTypes Hook
 * 기관 유형 목록 (Rails enum 기반 고정값)
 */
export function useInstitutionTypes() {
  return useQuery({
    queryKey: ['institution-types'],
    queryFn: async () => INSTITUTION_TYPES,
  });
}

/**
 * useInstitutionType Hook
 */
export function useInstitutionType(institutionTypeId: string | undefined) {
  return useQuery({
    queryKey: ['institution-type', institutionTypeId],
    queryFn: async () => {
      if (!institutionTypeId) throw new Error('Institution Type ID is required');
      return INSTITUTION_TYPES.find((t) => t.id === institutionTypeId || t.typeCode === institutionTypeId) ?? null;
    },
    enabled: !!institutionTypeId,
  });
}

// Rails admin API 응답 → Institution 변환
function normalizeInstitution(raw: Record<string, unknown>): Institution {
  return {
    id:                   Number(raw.id),
    name:                 String(raw.name ?? ''),
    institution_type:     String(raw.institution_type ?? raw.institutionType ?? ''),
    institutionTypeId:    String(raw.institution_type ?? raw.institutionType ?? ''),
    status:               String(raw.status ?? ''),
    address:              String(raw.address ?? ''),
    phone:                String(raw.phone ?? ''),
    business_number:      String(raw.business_number ?? raw.businessRegistrationNo ?? ''),
    businessRegistrationNo: String(raw.business_number ?? raw.businessRegistrationNo ?? ''),
  };
}

/**
 * useInstitution Hook
 * 기관 정보 조회 — /api/v1/admin/institutions/:id 사용
 */
export function useInstitution(institutionId: string | undefined) {
  return useQuery({
    queryKey: ['institution', institutionId],
    queryFn: async () => {
      if (!institutionId) throw new Error('Institution ID is required');
      const raw = await railsClient.get<Record<string, unknown>>(`/admin/institutions/${institutionId}`);
      return normalizeInstitution(raw);
    },
    enabled: !!institutionId,
  });
}
