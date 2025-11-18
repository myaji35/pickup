import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PassengerGroup, UpdatePassengerGroupRequest } from '@/types/passenger-group';
import { toast } from 'sonner';

interface UpdatePassengerGroupParams {
  id: string;
  institutionId: string;
  data: UpdatePassengerGroupRequest;
}

/**
 * Update a passenger group
 */
async function updatePassengerGroup({ id, data }: UpdatePassengerGroupParams): Promise<PassengerGroup> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/passenger-groups/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update passenger group');
  }

  return response.json();
}

/**
 * useUpdatePassengerGroup Hook
 * 승객 그룹 정보 수정 mutation
 */
export function useUpdatePassengerGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePassengerGroup,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['passengerGroups', variables.institutionId] });
      toast.success('Passenger group updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
