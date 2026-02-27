import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * T259: useConnectVehicleToGroup mutation hook
 * 차량을 승객 그룹에 연결하는 mutation
 */

interface ConnectVehicleToGroupParams {
  vehicleId: string;
  groupId: string;
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

async function connectVehicleToGroup(params: ConnectVehicleToGroupParams): Promise<Vehicle> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/vehicles/${params.vehicleId}/connect-group`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ groupId: params.groupId }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to connect vehicle to group');
  }

  const data = await response.json();
  return data.data;
}

export function useConnectVehicleToGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: connectVehicleToGroup,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', variables.vehicleId] });
      toast.success('Vehicle connected to group successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to connect vehicle to group');
    },
  });
}
