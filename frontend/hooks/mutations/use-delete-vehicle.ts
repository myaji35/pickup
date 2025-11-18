import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useUIStore } from '@/lib/store/use-ui-store';

/**
 * useDeleteVehicle Hook
 * 차량 삭제 mutation
 */
export function useDeleteVehicle() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: async ({ id, institutionId }: { id: string; institutionId: string }) => {
      await apiClient.delete(`/vehicles/${id}`);
      return { id, institutionId };
    },
    onSuccess: (data) => {
      // 차량 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['vehicles', data.institutionId] });

      // 성공 토스트
      addToast({
        type: 'success',
        message: '차량이 삭제되었습니다',
      });
    },
    onError: (error: any) => {
      // 에러 토스트
      addToast({
        type: 'error',
        message: error.message || '차량 삭제에 실패했습니다',
      });
    },
  });
}
