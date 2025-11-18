import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PassengerSchedule, UpsertPassengerScheduleRequest } from '@/types/passenger-schedule';

/**
 * T362: useUpsertPassengerSchedule Mutation Hook
 * 승객 스케줄 생성/수정 훅
 */

async function upsertPassengerSchedule(
  passengerId: string,
  data: UpsertPassengerScheduleRequest
): Promise<PassengerSchedule> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/passengers/${passengerId}/schedule`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to upsert passenger schedule');
  }

  return response.json();
}

export function useUpsertPassengerSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ passengerId, data }: { passengerId: string; data: UpsertPassengerScheduleRequest }) =>
      upsertPassengerSchedule(passengerId, data),
    onSuccess: (_, variables) => {
      // Invalidate passenger queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['passengers'] });
      queryClient.invalidateQueries({ queryKey: ['passenger', variables.passengerId] });
    },
  });
}
