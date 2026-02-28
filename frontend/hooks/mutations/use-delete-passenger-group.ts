import { useMutation, useQueryClient } from '@tanstack/react-query';
import { railsClient } from '@/lib/rails-client';

interface DeletePassengerGroupParams {
  id: string;
  institutionId: string;
}

export function useDeletePassengerGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: DeletePassengerGroupParams) =>
      railsClient.delete(`/institutions/rosters/${id}`),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['passengerGroups', variables.institutionId] });
    },
  });
}
