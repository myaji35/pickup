import { useQuery } from '@tanstack/react-query';
import { PassengerGroup } from '@/types/passenger-group';

/**
 * Fetch passenger groups for an institution
 */
async function fetchPassengerGroups(institutionId: string): Promise<PassengerGroup[]> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/passenger-groups?institutionId=${institutionId}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch passenger groups');
  }

  return response.json();
}

/**
 * usePassengerGroups Hook
 * 기관의 승객 그룹 목록 조회
 */
export function usePassengerGroups(institutionId: string) {
  return useQuery({
    queryKey: ['passengerGroups', institutionId],
    queryFn: () => fetchPassengerGroups(institutionId),
    enabled: !!institutionId,
  });
}
