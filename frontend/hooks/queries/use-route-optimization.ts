/**
 * Route Optimization Hooks — Epic 9
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { railsClient } from '@/lib/rails-client';
import {
  OptimizationResult,
  RoutePreviewResponse,
  ApplyOptimizationRequest,
  ApplyOptimizationResponse,
} from '@/types/route-optimization';

// ─── 경로 미리보기 (현재 boarding_order 기준) ───────────────────
export function useRoutePreview(rosterId: number | null) {
  return useQuery({
    queryKey: ['route-optimization', 'preview', rosterId],
    queryFn: () =>
      railsClient.get<RoutePreviewResponse>(
        `/institutions/rosters/${rosterId}/route_preview`
      ),
    enabled: !!rosterId,
  });
}

// ─── 경로 최적화 실행 (DB 미저장, 미리보기용) ────────────────────
export function useOptimizeRoute() {
  return useMutation({
    mutationFn: (rosterId: number) =>
      railsClient.post<OptimizationResult>(
        `/institutions/rosters/${rosterId}/optimize`,
        {}
      ),
  });
}

// ─── 최적화 결과 확정 적용 (DB 저장) ────────────────────────────
export function useApplyOptimization(rosterId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ApplyOptimizationRequest) =>
      railsClient.post<ApplyOptimizationResponse>(
        `/institutions/rosters/${rosterId}/apply_optimization`,
        body
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['route-optimization', 'preview', rosterId] });
    },
  });
}
