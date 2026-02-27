import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { InstitutionType } from '@/types/institution-type';
import { Institution } from '@/types/institution';

/**
 * T407: useInstitutionTypes Hook
 * 기관 유형 목록 조회
 */
export function useInstitutionTypes() {
  return useQuery({
    queryKey: ['institution-types'],
    queryFn: async () => {
      return apiClient.get<InstitutionType[]>('/institution-types');
    },
  });
}

/**
 * useInstitutionType Hook
 * 기관 유형 단건 조회
 */
export function useInstitutionType(institutionTypeId: string | undefined) {
  return useQuery({
    queryKey: ['institution-type', institutionTypeId],
    queryFn: async () => {
      if (!institutionTypeId) {
        throw new Error('Institution Type ID is required');
      }

      return apiClient.get<InstitutionType>(`/institution-types/${institutionTypeId}`);
    },
    enabled: !!institutionTypeId,
  });
}

/**
 * useInstitution Hook
 * 기관 정보 조회
 */
export function useInstitution(institutionId: string | undefined) {
  return useQuery({
    queryKey: ['institution', institutionId],
    queryFn: async () => {
      if (!institutionId) {
        throw new Error('Institution ID is required');
      }

      return apiClient.get<Institution>(`/institutions/${institutionId}`);
    },
    enabled: !!institutionId,
  });
}
