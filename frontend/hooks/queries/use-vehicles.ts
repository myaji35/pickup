import { useQuery } from '@tanstack/react-query';
import { railsClient } from '@/lib/rails-client';
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
      const raw = await railsClient.get<any[]>('/institutions/vehicles');
      return raw.map((v: any): Vehicle => ({
        id: String(v.id),
        lastFourDigits: v.plate_last4 ?? '',
        passengerCapacity: v.capacity ?? 0,
        institutionId: String(v.institution_id ?? ''),
        currentGroupId: v.current_group_id ?? null,
        createdAt: v.created_at ?? '',
        updatedAt: v.updated_at ?? '',
      }));
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
      return railsClient.get<Vehicle>(`/institutions/vehicles/${vehicleId}`);
    },
    enabled: !!vehicleId,
  });
}
