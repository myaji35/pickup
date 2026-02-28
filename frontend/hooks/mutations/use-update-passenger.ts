import { useMutation, useQueryClient } from '@tanstack/react-query';
import { railsClient } from '@/lib/rails-client';
import { Passenger, UpdatePassengerRequest } from '@/types/passenger';

interface UpdatePassengerParams {
  id: string;
  institutionId: string;
  data: UpdatePassengerRequest;
}

export function useUpdatePassenger() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: UpdatePassengerParams) =>
      railsClient.patch<Passenger>(`/institutions/passengers/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['passengers', variables.institutionId] });
    },
  });
}
