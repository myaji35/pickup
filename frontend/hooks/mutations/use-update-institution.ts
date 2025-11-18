import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Institution, UpdateInstitutionInput } from '@/types/institution';
import { useUIStore } from '@/lib/store/use-ui-store';

/**
 * T408: useUpdateInstitution Hook
 * 기관 정보 수정 mutation (이름, 유형 변경)
 */
export function useUpdateInstitution() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateInstitutionInput }) => {
      return apiClient.patch<Institution>(`/institutions/${id}`, data);
    },
    onSuccess: (data) => {
      // 기관 상세 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['institution', data.id] });

      // 성공 토스트
      addToast({
        type: 'success',
        message: '기관 정보가 수정되었습니다',
      });
    },
    onError: (error: any) => {
      // 에러 토스트
      addToast({
        type: 'error',
        message: error.message || '기관 정보 수정에 실패했습니다',
      });
    },
  });
}
