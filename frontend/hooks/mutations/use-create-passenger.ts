import { useMutation, useQueryClient } from '@tanstack/react-query';
import { railsClient } from '@/lib/rails-client';
import { Passenger, CreatePassengerRequest } from '@/types/passenger';

export function useCreatePassenger() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePassengerRequest) =>
      railsClient.post<Passenger>('/institutions/passengers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passengers'] });
    },
  });
}
