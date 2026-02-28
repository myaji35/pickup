import { useMutation, useQueryClient } from '@tanstack/react-query';
import { railsClient } from '@/lib/rails-client';

interface DeletePassengerParams {
  id: string;
  institutionId: string;
}

export function useDeletePassenger() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: DeletePassengerParams) =>
      railsClient.delete(`/institutions/passengers/${id}`),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['passengers', variables.institutionId] });
    },
  });
}
