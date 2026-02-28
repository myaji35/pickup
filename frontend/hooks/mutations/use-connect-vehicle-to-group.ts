import { useMutation, useQueryClient } from '@tanstack/react-query';
import { railsClient } from '@/lib/rails-client';

interface ConnectVehicleToGroupParams {
  vehicleId: string;
  groupId: string;  // roster id
}

// roster의 vehicle_id를 업데이트하여 차량-그룹 연결
export function useConnectVehicleToGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ vehicleId, groupId }: ConnectVehicleToGroupParams) =>
      railsClient.patch(`/institutions/rosters/${groupId}`, { vehicle_id: vehicleId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['passengerGroups'] });
    },
  });
}
