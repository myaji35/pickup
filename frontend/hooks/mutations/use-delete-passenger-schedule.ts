import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * T363: useDeletePassengerSchedule Mutation Hook
 * 승객 스케줄 삭제 훅
 */

async function deletePassengerSchedule(passengerId: string): Promise<void> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/passengers/${passengerId}/schedule`,
    {
      method: 'DELETE',
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete passenger schedule');
  }
}

export function useDeletePassengerSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (passengerId: string) => deletePassengerSchedule(passengerId),
    onSuccess: (_, passengerId) => {
      // Invalidate passenger queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['passengers'] });
      queryClient.invalidateQueries({ queryKey: ['passenger', passengerId] });
    },
  });
}
