import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PassengerGroup, CreatePassengerGroupRequest } from '@/types/passenger-group';
import { toast } from 'sonner';

/**
 * Create a new passenger group
 */
async function createPassengerGroup(data: CreatePassengerGroupRequest): Promise<PassengerGroup> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/passenger-groups`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create passenger group');
  }

  return response.json();
}

/**
 * useCreatePassengerGroup Hook
 * 새로운 승객 그룹 생성 mutation
 */
export function useCreatePassengerGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPassengerGroup,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['passengerGroups', variables.institutionId] });
      toast.success('Passenger group created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
