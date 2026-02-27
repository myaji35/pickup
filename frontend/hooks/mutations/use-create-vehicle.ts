import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Vehicle, CreateVehicleInput } from '@/types/vehicle';
import { useUIStore } from '@/lib/store/use-ui-store';

/**
 * useCreateVehicle Hook
 * 차량 등록 mutation
 */
export function useCreateVehicle() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: async (input: CreateVehicleInput) => {
      return apiClient.post<Vehicle>('/vehicles', input);
    },
    onSuccess: (data) => {
      // 차량 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['vehicles', data.institutionId] });

      // 성공 토스트
      addToast({
        type: 'success',
        message: '차량이 등록되었습니다',
      });
    },
    onError: (error: any) => {
      // 에러 토스트
      addToast({
        type: 'error',
        message: error.message || '차량 등록에 실패했습니다',
      });
    },
  });
}
