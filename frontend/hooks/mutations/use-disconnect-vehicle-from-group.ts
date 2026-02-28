import { useMutation, useQueryClient } from '@tanstack/react-query';
import { railsClient } from '@/lib/rails-client';

interface DisconnectVehicleFromGroupParams {
  vehicleId: string;
  groupId?: string;  // roster id
}

export function useDisconnectVehicleFromGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId }: DisconnectVehicleFromGroupParams) => {
      if (!groupId) throw new Error('groupId is required');
      return railsClient.patch(`/institutions/rosters/${groupId}`, { vehicle_id: null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['passengerGroups'] });
    },
  });
}
