import { useMutation, useQueryClient } from '@tanstack/react-query';
import { railsClient } from '@/lib/rails-client';
import { Vehicle, CreateVehicleInput } from '@/types/vehicle';

/**
 * useCreateVehicle Hook
 * 차량 등록 mutation
 */
export function useCreateVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateVehicleInput) => {
      return railsClient.post<Vehicle>('/institutions/vehicles', input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });
}
