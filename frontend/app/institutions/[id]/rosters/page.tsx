'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { railsClient } from '@/lib/rails-client';
import { Loader2, Route, Calendar, Users, ChevronRight, Zap } from 'lucide-react';

interface Roster {
  id: number;
  name: string;
  week_start: string;
  week_end: string;
  passenger_count: number;
  last_optimized_at: string | null;
  optimized_distance_km: number | null;
}

/**
 * 탑승 그룹(Roster) 목록 — 경로 최적화 진입점
 */
export default function RostersPage() {
  const params = useParams();
  const institutionId = params.id as string;

  const { data, isLoading, error } = useQuery({
    queryKey: ['rosters', institutionId],
    queryFn: () => railsClient.get<Roster[]>('/institutions/rosters'),
  });

  const rosters: Roster[] = Array.isArray(data) ? data : [];

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#16325C]">탑승 그룹 관리</h1>
          <p className="text-sm text-gray-500 mt-1">
            각 그룹을 선택하여 AI 경로 최적화를 실행하세요
          </p>
        </div>
      </div>

      {/* AI 경로 최적화 안내 배너 */}
      <div className="rounded-lg bg-gradient-to-r from-[#00A1E0]/10 to-blue-50 border border-[#00A1E0]/20 p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-[#00A1E0]/10">
            <Zap className="w-5 h-5 text-[#00A1E0]" strokeWidth={2} />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#16325C]">AI 경로 최적화 (OR-Tools VRP)</p>
            <p className="text-xs text-gray-600 mt-0.5">
              Google OR-Tools 기반 최단 경로 계산. 카카오 내비 실시간 교통 데이터 적용.
              평균 15~30% 거리 단축 효과.
            </p>
          </div>
        </div>
      </div>

      {/* 로스터 목록 */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[#00A1E0]" />
        </div>
      ) : error ? (
        <div className="text-center py-16 text-red-500 text-sm">
          데이터를 불러오는 데 실패했습니다.
        </div>
      ) : rosters.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          등록된 탑승 그룹이 없습니다.
        </div>
      ) : (
        <div className="grid gap-3">
          {rosters.map((roster) => (
            <Link
              key={roster.id}
              href={`/institutions/${institutionId}/rosters/${roster.id}/optimize`}
              className="block"
            >
              <div className="bg-white rounded-lg border border-gray-200 p-4 hover:border-[#00A1E0] hover:shadow-sm transition-all group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-50 group-hover:bg-[#00A1E0]/10">
                      <Route className="w-4 h-4 text-[#00A1E0]" strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#16325C]">{roster.name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" strokeWidth={2} />
                          {roster.week_start} ~ {roster.week_end}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Users className="w-3 h-3" strokeWidth={2} />
                          {roster.passenger_count}명
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {roster.last_optimized_at ? (
                      <div className="text-right">
                        <p className="text-xs text-green-600 font-medium">최적화 완료</p>
                        <p className="text-xs text-gray-400">
                          {roster.optimized_distance_km?.toFixed(1)}km
                        </p>
                      </div>
                    ) : (
                      <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        미최적화
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#00A1E0]" strokeWidth={2} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
