import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Vehicle, UpdateVehicleInput } from '@/types/vehicle';
import { useUIStore } from '@/lib/store/use-ui-store';

/**
 * useUpdateVehicle Hook
 * 차량 정보 수정 mutation
 */
export function useUpdateVehicle() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateVehicleInput }) => {
      return apiClient.patch<Vehicle>(`/vehicles/${id}`, data);
    },
    onSuccess: (data) => {
      // 차량 목록 및 상세 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['vehicles', data.institutionId] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', data.id] });

      // 성공 토스트
      addToast({
        type: 'success',
        message: '차량 정보가 수정되었습니다',
      });
    },
    onError: (error: any) => {
      // 에러 토스트
      addToast({
        type: 'error',
        message: error.message || '차량 정보 수정에 실패했습니다',
      });
    },
  });
}
