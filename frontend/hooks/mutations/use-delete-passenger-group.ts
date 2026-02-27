import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface DeletePassengerGroupParams {
  id: string;
  institutionId: string;
}

/**
 * Delete a passenger group
 */
async function deletePassengerGroup(id: string): Promise<void> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/passenger-groups/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete passenger group');
  }
}

/**
 * useDeletePassengerGroup Hook
 * 승객 그룹 삭제 mutation
 */
export function useDeletePassengerGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: DeletePassengerGroupParams) => deletePassengerGroup(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['passengerGroups', variables.institutionId] });
      toast.success('Passenger group deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
