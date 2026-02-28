import { useMutation, useQueryClient } from '@tanstack/react-query';
import { railsClient } from '@/lib/rails-client';
import { Vehicle, UpdateVehicleInput } from '@/types/vehicle';

/**
 * useUpdateVehicle Hook
 * 차량 정보 수정 mutation
 */
export function useUpdateVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateVehicleInput }) => {
      return railsClient.patch<Vehicle>(`/institutions/vehicles/${id}`, data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', String((data as any).id)] });
    },
  });
}
