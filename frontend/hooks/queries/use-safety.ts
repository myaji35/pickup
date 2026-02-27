/**
 * Safety Dashboard Hooks — Epic 7 Phase B
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { railsClient } from '@/lib/rails-client';
import {
  SafetyScoresResponse,
  DrivingEvent,
  SafetySummary,
  DtcReport,
} from '@/types/safety';

// ─── 안전 점수 (주별 드라이버 랭킹) ────────────────────────────
export function useSafetyScores(year?: number, week?: number) {
  return useQuery({
    queryKey: ['safety', 'scores', year, week],
    queryFn: () =>
      railsClient.get<SafetyScoresResponse>('/institutions/safety/scores', {
        ...(year ? { year } : {}),
        ...(week ? { week } : {}),
      }),
  });
}

// ─── 이벤트 목록 (필터 지원) ────────────────────────────────────
export function useSafetyEvents(params?: {
  event_type?: string;
  driver_id?: number;
  date_from?: string;
  date_to?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['safety', 'events', params],
    queryFn: () =>
      railsClient.get<DrivingEvent[]>('/institutions/safety/events', {
        ...(params?.event_type ? { event_type: params.event_type } : {}),
        ...(params?.driver_id  ? { driver_id: params.driver_id }  : {}),
        ...(params?.date_from  ? { date_from: params.date_from }  : {}),
        ...(params?.date_to    ? { date_to:   params.date_to }    : {}),
        limit: params?.limit ?? 50,
      }),
  });
}

// ─── 30일 요약 ──────────────────────────────────────────────────
export function useSafetySummary() {
  return useQuery({
    queryKey: ['safety', 'summary'],
    queryFn: () => railsClient.get<SafetySummary>('/institutions/safety/summary'),
    staleTime: 5 * 60 * 1000, // 5분 캐시
  });
}

// ─── DTC 이력 ───────────────────────────────────────────────────
export function useDtcReports(params?: { status?: string; code?: string; limit?: number }) {
  return useQuery({
    queryKey: ['safety', 'dtc', params],
    queryFn: () =>
      railsClient.get<DtcReport[]>('/institutions/safety/dtc_history', {
        ...(params?.status ? { status: params.status } : {}),
        ...(params?.code   ? { code:   params.code }   : {}),
        limit: params?.limit ?? 50,
      }),
  });
}

// ─── DTC 확인 처리 (PATCH) ──────────────────────────────────────
export function useAcknowledgeDtc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      railsClient.patch<DtcReport>(`/institutions/safety/dtc_history/${id}/acknowledge`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['safety', 'dtc'] });
    },
  });
}
