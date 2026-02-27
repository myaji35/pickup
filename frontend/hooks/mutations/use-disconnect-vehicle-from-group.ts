import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * T260: useDisconnectVehicleFromGroup mutation hook
 * 차량의 그룹 연결을 해제하는 mutation
 */

interface DisconnectVehicleFromGroupParams {
  vehicleId: string;
}

interface Vehicle {
  id: string;
  lastFourDigits: string;
  passengerCapacity: number;
  institutionId: string;
  currentGroupId: string | null;
  createdAt: string;
  updatedAt: string;
}

async function disconnectVehicleFromGroup(params: DisconnectVehicleFromGroupParams): Promise<Vehicle> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/vehicles/${params.vehicleId}/disconnect-group`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to disconnect vehicle from group');
  }

  const data = await response.json();
  return data.data;
}

export function useDisconnectVehicleFromGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: disconnectVehicleFromGroup,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', variables.vehicleId] });
      toast.success('Vehicle disconnected from group successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to disconnect vehicle from group');
    },
  });
}
