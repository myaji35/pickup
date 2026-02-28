import { useMutation, useQueryClient } from '@tanstack/react-query';
import { railsClient } from '@/lib/rails-client';

export function useDeletePassengerSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (passengerId: string) =>
      railsClient.delete(`/institutions/passengers/${passengerId}/schedule`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passengers'] });
    },
  });
}
