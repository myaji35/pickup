'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  useRoutePreview,
  useOptimizeRoute,
  useApplyOptimization,
} from '@/hooks/queries/use-route-optimization';
import {
  OptimizationResult,
  OptimizedPassenger,
  RoutePreviewPassenger,
} from '@/types/route-optimization';
import { railsClient } from '@/lib/rails-client';
import {
  Loader2,
  Zap,
  CheckCircle,
  MapPin,
  ArrowRight,
  Route,
  Clock,
  Fuel,
  TrendingDown,
  ChevronLeft,
  AlertCircle,
  Edit2,
  Save,
} from 'lucide-react';

/**
 * AI 경로 최적화 페이지 — Epic 9-4
 *
 * 기능:
 * 1. 현재 경로 미리보기 (boarding_order 기준)
 * 2. VRP 최적화 실행 (결과 미리보기, DB 미저장)
 * 3. 최적화 결과 비교 (거리/시간 Before vs After)
 * 4. 확정 적용 (DB 저장)
 */
export default function RouteOptimizePage() {
  const params = useParams();
  const router = useRouter();
  const institutionId = params.id as string;
  const rosterId = Number(params.rosterId);

  const qc = useQueryClient();

  // 현재 경로 미리보기
  const { data: preview, isLoading: isLoadingPreview } = useRoutePreview(rosterId);

  // Roster 상세 (출발지/시간)
  const { data: roster } = useQuery({
    queryKey: ['roster', rosterId],
    queryFn: () => railsClient.get<any>(`/institutions/rosters/${rosterId}`),
    enabled: !!rosterId,
  });

  // 출발지/시간 편집 상태
  const [editingDeparture, setEditingDeparture] = useState(false);
  const [deptAddress, setDeptAddress] = useState('');
  const [deptTime, setDeptTime] = useState('');

  const saveDepartureMutation = useMutation({
    mutationFn: () => railsClient.patch(`/institutions/rosters/${rosterId}`, {
      roster: { departure_address: deptAddress, departure_time: deptTime }
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roster', rosterId] });
      qc.invalidateQueries({ queryKey: ['rosters'] });
      setEditingDeparture(false);
    },
  });

  // 최적화 결과 (로컬 상태)
  const [optimizedResult, setOptimizedResult] = useState<OptimizationResult | null>(null);

  // Mutations
  const optimizeMutation  = useOptimizeRoute();
  const applyMutation     = useApplyOptimization(rosterId);

  // ─── 최적화 실행 ─────────────────────────────────────────────
  const handleOptimize = async () => {
    try {
      const result = await optimizeMutation.mutateAsync(rosterId);
      setOptimizedResult(result);
    } catch {
      // 에러는 optimizeMutation.error 로 처리
    }
  };

  // ─── 최적화 확정 적용 ─────────────────────────────────────────
  const handleApply = async () => {
    if (!optimizedResult) return;
    try {
      await applyMutation.mutateAsync({
        optimized_passengers: optimizedResult.optimized_passengers,
        total_distance_m:     optimizedResult.total_distance_m,
        total_duration_sec:   optimizedResult.total_duration_sec,
        distance_source:      optimizedResult.distance_source,
      });
      // 적용 후 상태 초기화 + 목록으로 이동
      setOptimizedResult(null);
      router.push(`/institutions/${institutionId}/rosters`);
    } catch {
      // 에러는 applyMutation.error 로 처리
    }
  };

  // ─── 절감 효과 계산 (Before - After) ──────────────────────────
  const savings = (() => {
    if (!optimizedResult || !preview?.total_distance_m) return null;
    const savedM = preview.total_distance_m - optimizedResult.total_distance_m;
    if (savedM <= 0) return null;
    return {
      saved_m:   savedM,
      saved_km:  (savedM / 1000).toFixed(2),
      rate:      ((savedM / preview.total_distance_m) * 100).toFixed(1),
      fuel_krw:  Math.floor((savedM / 1000 / 12) * 1650),
    };
  })();

  // ─── 헬퍼: 초 → 분:초 포맷 ────────────────────────────────────
  const formatDuration = (sec: number | null | undefined) => {
    if (!sec) return '-';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return s > 0 ? `${m}분 ${s}초` : `${m}분`;
  };

  // ─── 렌더링 ───────────────────────────────────────────────────
  if (isLoadingPreview) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-[#00A1E0]" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push(`/institutions/${institutionId}/rosters`)}
          className="p-1.5 rounded-lg hover:bg-gray-100"
        >
          <ChevronLeft className="w-5 h-5 text-gray-500" strokeWidth={2} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#16325C]">AI 경로 최적화</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Roster #{rosterId} — Google OR-Tools VRP 솔버
          </p>
        </div>
      </div>

      {/* ─── 출발지 / 출발시간 설정 ─────────────────────────────── */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-[#16325C] flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#00A1E0]" strokeWidth={2} />
            출발지 &amp; 출발시간
          </p>
          {!editingDeparture ? (
            <button
              onClick={() => {
                setDeptAddress(roster?.departure_address ?? '');
                setDeptTime(roster?.departure_time ?? '');
                setEditingDeparture(true);
              }}
              className="flex items-center gap-1 text-xs text-[#00A1E0] hover:underline"
            >
              <Edit2 className="w-3 h-3" strokeWidth={2} />
              편집
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditingDeparture(false)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >취소</button>
              <button
                onClick={() => saveDepartureMutation.mutate()}
                disabled={saveDepartureMutation.isPending}
                className="flex items-center gap-1 text-xs bg-[#00A1E0] text-white px-2 py-1 rounded hover:bg-[#0081B3] disabled:opacity-50"
              >
                {saveDepartureMutation.isPending
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : <Save className="w-3 h-3" strokeWidth={2} />}
                저장
              </button>
            </div>
          )}
        </div>

        {editingDeparture ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">출발 주소</label>
              <input
                type="text"
                value={deptAddress}
                onChange={e => setDeptAddress(e.target.value)}
                placeholder="예: 서울시 마포구 기관 주소"
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00A1E0]/30"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">출발 시간 (HH:MM)</label>
              <input
                type="time"
                value={deptTime}
                onChange={e => setDeptTime(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00A1E0]/30"
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-6 text-sm">
            <span className="flex items-center gap-2 text-gray-700">
              <MapPin className="w-4 h-4 text-gray-400" strokeWidth={2} />
              {roster?.departure_address ?? <span className="text-gray-400 italic">출발지 미설정</span>}
            </span>
            <span className="flex items-center gap-2 text-gray-700">
              <Clock className="w-4 h-4 text-gray-400" strokeWidth={2} />
              {roster?.departure_time
                ? <span className="font-semibold text-[#00A1E0]">{roster.departure_time} 출발</span>
                : <span className="text-gray-400 italic">출발시간 미설정</span>}
            </span>
          </div>
        )}
      </div>

      {/* 에러 메시지 */}
      {(optimizeMutation.error || applyMutation.error) && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={2} />
          {optimizeMutation.error
            ? '경로 최적화에 실패했습니다. VRP 서비스 상태를 확인하세요.'
            : '최적화 결과 적용에 실패했습니다.'}
        </div>
      )}

      {/* ─── 비교 카드 (Before / After) ───────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Before: 현재 경로 */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
              현재 경로
            </p>
            {preview?.last_optimized_at && (
              <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                최적화됨
              </span>
            )}
          </div>

          <div className="space-y-3">
            <Metric
              icon={<Route className="w-4 h-4 text-gray-500" strokeWidth={2} />}
              label="총 거리"
              value={preview?.total_distance_km ? `${preview.total_distance_km} km` : '-'}
            />
            <Metric
              icon={<Clock className="w-4 h-4 text-gray-500" strokeWidth={2} />}
              label="예상 시간"
              value={formatDuration(preview?.total_duration_sec)}
            />
            <Metric
              icon={<MapPin className="w-4 h-4 text-gray-500" strokeWidth={2} />}
              label="승객 수"
              value={`${preview?.passengers?.length ?? 0}명`}
            />
          </div>

          {preview?.distance_source && (
            <p className="mt-3 text-xs text-gray-400">
              거리 출처: {preview.distance_source === 'kakao' ? '카카오 내비' : 'Haversine'}
            </p>
          )}
        </div>

        {/* After: 최적화 결과 */}
        <div className={`bg-white rounded-lg border p-5 ${
          optimizedResult ? 'border-[#00A1E0]' : 'border-gray-200 opacity-60'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-[#00A1E0] uppercase tracking-wide">
              최적화 후
            </p>
            {optimizedResult && (
              <span className="text-xs text-[#00A1E0] bg-[#00A1E0]/10 px-2 py-0.5 rounded-full">
                {optimizedResult.distance_source === 'kakao' ? '카카오 내비' : 'Haversine'}
              </span>
            )}
          </div>

          {optimizedResult ? (
            <div className="space-y-3">
              <Metric
                icon={<Route className="w-4 h-4 text-[#00A1E0]" strokeWidth={2} />}
                label="총 거리"
                value={`${optimizedResult.total_distance_km} km`}
                highlight
              />
              <Metric
                icon={<Clock className="w-4 h-4 text-[#00A1E0]" strokeWidth={2} />}
                label="예상 시간"
                value={`${optimizedResult.total_duration_min}분`}
                highlight
              />
              <Metric
                icon={<MapPin className="w-4 h-4 text-[#00A1E0]" strokeWidth={2} />}
                label="솔버 상태"
                value={optimizedResult.solver_status === 'OPTIMAL' ? '최적해' : '근사해'}
                highlight
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-24 text-gray-400 text-sm">
              <Zap className="w-6 h-6 mb-2" strokeWidth={1.5} />
              최적화를 실행하면 결과가 표시됩니다
            </div>
          )}
        </div>
      </div>

      {/* ─── 절감 효과 배너 ───────────────────────────────────────── */}
      {savings && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
            <TrendingDown className="w-4 h-4" strokeWidth={2} />
            절감 효과
          </p>
          <div className="grid grid-cols-3 gap-4">
            <SavingItem label="거리 단축" value={`${savings.saved_km} km`} sub={`${savings.rate}% 감소`} />
            <SavingItem label="연료비 절감" value={`${savings.fuel_krw.toLocaleString()}원`} sub="추정치" />
            <SavingItem label="최적화율" value={`${savings.rate}%`} sub="원거리 대비" />
          </div>
        </div>
      )}

      {/* ─── 액션 버튼 ────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        {/* 최적화 실행 버튼 */}
        <button
          onClick={handleOptimize}
          disabled={optimizeMutation.isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#00A1E0] text-white text-sm font-medium
                     rounded-lg hover:bg-[#0081B3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {optimizeMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Zap className="w-4 h-4" strokeWidth={2} />
          )}
          {optimizeMutation.isPending ? '최적화 중...' : 'AI 경로 최적화 실행'}
        </button>

        {/* 확정 적용 버튼 (최적화 결과 있을 때만) */}
        {optimizedResult && (
          <button
            onClick={handleApply}
            disabled={applyMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-medium
                       rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {applyMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" strokeWidth={2} />
            )}
            {applyMutation.isPending ? '적용 중...' : '최적화 결과 확정'}
          </button>
        )}
      </div>

      {/* ─── 승객 순서 비교 테이블 ─────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 현재 순서 */}
        <PassengerOrderTable
          title="현재 픽업 순서"
          passengers={preview?.passengers ?? []}
          variant="current"
        />

        {/* 최적화 후 순서 */}
        {optimizedResult && (
          <PassengerOrderTable
            title="최적화 후 픽업 순서"
            passengers={optimizedResult.optimized_passengers}
            variant="optimized"
          />
        )}
      </div>
    </div>
  );
}

// ─── 서브 컴포넌트: 지표 행 ────────────────────────────────────────
function Metric({
  icon, label, value, highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-sm text-gray-500">
        {icon}
        {label}
      </span>
      <span className={`text-sm font-semibold ${highlight ? 'text-[#00A1E0]' : 'text-[#16325C]'}`}>
        {value}
      </span>
    </div>
  );
}

// ─── 서브 컴포넌트: 절감 항목 ─────────────────────────────────────
function SavingItem({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-bold text-green-700">{value}</p>
      <p className="text-xs text-gray-400">{sub}</p>
    </div>
  );
}

// ─── 서브 컴포넌트: 승객 순서 테이블 ─────────────────────────────
type CurrentPassenger = RoutePreviewPassenger;
type OptimPassenger   = OptimizedPassenger;

function PassengerOrderTable({
  title,
  passengers,
  variant,
}: {
  title: string;
  passengers: CurrentPassenger[] | OptimPassenger[];
  variant: 'current' | 'optimized';
}) {
  const borderColor = variant === 'optimized' ? 'border-[#00A1E0]' : 'border-gray-200';
  const headerBg    = variant === 'optimized' ? 'bg-[#00A1E0]/5' : 'bg-gray-50';

  return (
    <div className={`bg-white rounded-lg border ${borderColor} overflow-hidden`}>
      <div className={`px-4 py-3 ${headerBg} border-b ${borderColor}`}>
        <p className={`text-sm font-semibold ${variant === 'optimized' ? 'text-[#00A1E0]' : 'text-gray-700'}`}>
          {title}
        </p>
      </div>
      <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
        {passengers.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-gray-400">
            승객 정보가 없습니다
          </div>
        ) : (
          passengers.map((p, idx) => {
            const order   = 'boarding_order' in p ? (p.boarding_order ?? idx + 1) : idx + 1;
            const arrSec  = 'estimated_arrival_sec' in p ? p.estimated_arrival_sec : null;
            const arrMin  = arrSec ? Math.round(arrSec / 60) : null;

            return (
              <div key={p.id} className="px-4 py-3 flex items-start gap-3 hover:bg-gray-50">
                {/* 순서 번호 */}
                <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                  ${variant === 'optimized' ? 'bg-[#00A1E0]/10 text-[#00A1E0]' : 'bg-gray-100 text-gray-600'}`}>
                  {order}
                </span>

                {/* 승객 정보 */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#16325C] truncate">{p.name}</p>
                  <p className="text-xs text-gray-400 truncate flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 shrink-0" strokeWidth={2} />
                    {p.pickup_address || '주소 미등록'}
                  </p>
                </div>

                {/* ETA */}
                {arrMin !== null && (
                  <span className="shrink-0 text-xs text-gray-500">
                    +{arrMin}분
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
