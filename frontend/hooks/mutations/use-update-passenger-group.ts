import { useMutation, useQueryClient } from '@tanstack/react-query';
import { railsClient } from '@/lib/rails-client';
import { PassengerGroup } from '@/types/passenger-group';

interface UpdatePassengerGroupParams {
  id: string;
  institutionId: string;
  data: Record<string, unknown>;
}

export function useUpdatePassengerGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: UpdatePassengerGroupParams) =>
      railsClient.patch<PassengerGroup>(`/institutions/rosters/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['passengerGroups', variables.institutionId] });
    },
  });
}
