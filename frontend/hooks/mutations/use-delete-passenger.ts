import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface DeletePassengerParams {
  id: string;
  institutionId: string;
}

async function deletePassenger(id: string): Promise<void> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/passengers/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete passenger');
  }
}

export function useDeletePassenger() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: DeletePassengerParams) => deletePassenger(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['passengers', variables.institutionId] });
      toast.success('Passenger deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
