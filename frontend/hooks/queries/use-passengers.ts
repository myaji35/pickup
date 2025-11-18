import { useQuery } from '@tanstack/react-query';
import { Passenger } from '@/types/passenger';

async function fetchPassengers(
  institutionId: string,
  filters?: {
    shuttleType?: string;
    search?: string;
    groupId?: string;
  },
): Promise<Passenger[]> {
  const params = new URLSearchParams({ institutionId });
  if (filters?.shuttleType) params.append('shuttleType', filters.shuttleType);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.groupId) params.append('groupId', filters.groupId);

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/passengers?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch passengers');
  }

  return response.json();
}

export function usePassengers(
  institutionId: string,
  filters?: {
    shuttleType?: string;
    search?: string;
    groupId?: string;
  },
) {
  return useQuery({
    queryKey: ['passengers', institutionId, filters],
    queryFn: () => fetchPassengers(institutionId, filters),
    enabled: !!institutionId,
  });
}
