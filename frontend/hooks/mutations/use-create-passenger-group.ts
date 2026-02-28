import { useMutation, useQueryClient } from '@tanstack/react-query';
import { railsClient } from '@/lib/rails-client';
import { PassengerGroup } from '@/types/passenger-group';

interface CreatePassengerGroupRequest {
  name?: string;
  shuttle_type?: string;
  institutionId?: string;
  [key: string]: unknown;
}

export function useCreatePassengerGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePassengerGroupRequest) =>
      railsClient.post<PassengerGroup>('/institutions/rosters', data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['passengerGroups', variables.institutionId] });
    },
  });
}
