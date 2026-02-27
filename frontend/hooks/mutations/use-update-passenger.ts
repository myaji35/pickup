import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Passenger, UpdatePassengerRequest } from '@/types/passenger';
import { toast } from 'sonner';

interface UpdatePassengerParams {
  id: string;
  institutionId: string;
  data: UpdatePassengerRequest;
}

async function updatePassenger({ id, data }: UpdatePassengerParams): Promise<Passenger> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/passengers/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update passenger');
  }

  return response.json();
}

export function useUpdatePassenger() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePassenger,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['passengers', variables.institutionId] });
      toast.success('Passenger updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
