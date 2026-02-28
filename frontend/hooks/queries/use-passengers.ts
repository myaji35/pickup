import { useQuery } from '@tanstack/react-query';
import { railsClient } from '@/lib/rails-client';
import { Passenger } from '@/types/passenger';

async function fetchPassengers(
  institutionId: string,
  filters?: {
    shuttleType?: string;
    search?: string;
    groupId?: string;
    assignmentStatus?: 'assigned' | 'unassigned';
  },
): Promise<Passenger[]> {
  const params: Record<string, string> = {};
  if (filters?.shuttleType) params.shuttle_type = filters.shuttleType;
  if (filters?.search) params.search = filters.search;
  if (filters?.groupId) params.group_id = filters.groupId;
  if (filters?.assignmentStatus) params.assignment_status = filters.assignmentStatus;

  return railsClient.get<Passenger[]>('/institutions/passengers', params);
}

export function usePassengers(
  institutionId: string,
  filters?: {
    shuttleType?: string;
    search?: string;
    groupId?: string;
    assignmentStatus?: 'assigned' | 'unassigned';
  },
) {
  return useQuery({
    queryKey: ['passengers', institutionId, filters],
    queryFn: () => fetchPassengers(institutionId, filters),
    enabled: !!institutionId,
  });
}
