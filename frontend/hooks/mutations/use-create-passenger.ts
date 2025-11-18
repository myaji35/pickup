import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Passenger, CreatePassengerRequest } from '@/types/passenger';
import { toast } from 'sonner';

async function createPassenger(data: CreatePassengerRequest): Promise<Passenger> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/passengers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create passenger');
  }

  return response.json();
}

export function useCreatePassenger() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPassenger,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['passengers', variables.institutionId] });
      toast.success('Passenger created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
