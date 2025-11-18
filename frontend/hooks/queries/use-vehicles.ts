import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Vehicle } from '@/types/vehicle';

/**
 * useVehicles Hook
 * 기관 내 차량 목록 조회
 */
export function useVehicles(institutionId: string | undefined) {
  return useQuery({
    queryKey: ['vehicles', institutionId],
    queryFn: async () => {
      if (!institutionId) {
        throw new Error('Institution ID is required');
      }

      return apiClient.get<Vehicle[]>('/vehicles', { institutionId });
    },
    enabled: !!institutionId,
  });
}

/**
 * useVehicle Hook
 * 차량 단건 조회
 */
export function useVehicle(vehicleId: string | undefined) {
  return useQuery({
    queryKey: ['vehicle', vehicleId],
    queryFn: async () => {
      if (!vehicleId) {
        throw new Error('Vehicle ID is required');
      }

      return apiClient.get<Vehicle>(`/vehicles/${vehicleId}`);
    },
    enabled: !!vehicleId,
  });
}
