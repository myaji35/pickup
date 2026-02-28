import { useQuery } from '@tanstack/react-query';
import { railsClient } from '@/lib/rails-client';
import { PassengerGroup } from '@/types/passenger-group';

// Rails roster → PassengerGroup 변환
function rosterToGroup(r: Record<string, unknown>): PassengerGroup {
  return {
    id:                  String(r.id),
    institutionId:       String(r.institution_id ?? ''),
    groupCode:           String(r.id),  // roster id를 groupCode로 사용
    name:                String(r.name ?? `탑승그룹 #${r.id}`),
    totalPassengerCount: Number(r.passenger_count ?? 0),
    createdAt:           String(r.created_at ?? ''),
    updatedAt:           String(r.updated_at ?? ''),
  };
}

/**
 * usePassengerGroups Hook
 * 기관의 탑승 그룹(Roster) 목록 조회
 */
export function usePassengerGroups(institutionId: string) {
  return useQuery({
    queryKey: ['passengerGroups', institutionId],
    queryFn: async () => {
      const rosters = await railsClient.get<Record<string, unknown>[]>('/institutions/rosters');
      return rosters.map(rosterToGroup);
    },
    enabled: !!institutionId,
  });
}
