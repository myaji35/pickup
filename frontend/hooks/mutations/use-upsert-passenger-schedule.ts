import { useMutation, useQueryClient } from '@tanstack/react-query';
import { railsClient } from '@/lib/rails-client';

interface UpsertPassengerScheduleRequest {
  [key: string]: unknown;
}

interface PassengerSchedule {
  id: number;
  [key: string]: unknown;
}

export function useUpsertPassengerSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ passengerId, data }: { passengerId: string; data: UpsertPassengerScheduleRequest }) =>
      railsClient.patch<PassengerSchedule>(`/institutions/passengers/${passengerId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['passengers'] });
    },
  });
}
