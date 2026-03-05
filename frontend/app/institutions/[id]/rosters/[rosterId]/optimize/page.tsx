'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  Loader2, Zap, CheckCircle2, MapPin, ArrowDown,
  Clock, TrendingDown, ChevronLeft, AlertCircle,
  Edit2, Save, Car, Flag, Users, Route,
  CheckCircle, Circle, GripVertical, X, UserPlus, ChevronDown,
} from 'lucide-react';

/**
 * 운행 계획 상세 — 탑승 시나리오 + AI 경로 최적화
 *
 * 탑승 시나리오 플로우:
 *   [출발지] → 승객A 픽업 → 승객B 픽업 → ... → [기관 도착]
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

  // 출발지/시간 편집
  const [editingDeparture, setEditingDeparture] = useState(false);
  const [deptAddress, setDeptAddress] = useState('');
  const [deptTime, setDeptTime] = useState('');

  const saveDepartureMutation = useMutation({
    mutationFn: () =>
      railsClient.patch(`/institutions/rosters/${rosterId}`, {
        roster: { departure_address: deptAddress, departure_time: deptTime },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roster', rosterId] });
      qc.invalidateQueries({ queryKey: ['rosters'] });
      setEditingDeparture(false);
    },
  });

  // 수동 순서 편집
  const [manualOrder, setManualOrder] = useState<RoutePreviewPassenger[] | null>(null);
  const [isEditingOrder, setIsEditingOrder] = useState(false);

  const reorderMutation = useMutation({
    mutationFn: (passengerIds: number[]) =>
      railsClient.patch(`/institutions/rosters/${rosterId}/reorder_passengers`, {
        passenger_ids: passengerIds,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['route-preview', rosterId] });
      qc.invalidateQueries({ queryKey: ['rosters'] });
      setManualOrder(null);
      setIsEditingOrder(false);
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const list = manualOrder ?? currentPassengers;
    const oldIdx = list.findIndex(p => p.id === active.id);
    const newIdx = list.findIndex(p => p.id === over.id);
    setManualOrder(arrayMove(list, oldIdx, newIdx));
  };

  const handleSaveOrder = () => {
    if (!manualOrder) return;
    reorderMutation.mutate(manualOrder.map(p => p.id));
  };

  // 탑승자 추가/삭제
  const [showAddPanel, setShowAddPanel] = useState(false);

  const addPassengerMutation = useMutation({
    mutationFn: (passengerId: number) =>
      railsClient.post(`/institutions/rosters/${rosterId}/add_passenger`, {
        passenger_id: passengerId,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['route-preview', rosterId] });
      qc.invalidateQueries({ queryKey: ['rosters'] });
    },
  });

  const removePassengerMutation = useMutation({
    mutationFn: (passengerId: number) =>
      railsClient.delete(`/institutions/rosters/${rosterId}/remove_passenger/${passengerId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['route-preview', rosterId] });
      qc.invalidateQueries({ queryKey: ['rosters'] });
      setManualOrder(null);
      setIsEditingOrder(false);
    },
  });

  // 기관 전체 승객 목록 (추가 패널용)
  const { data: allPassengers } = useQuery({
    queryKey: ['passengers', institutionId],
    queryFn: () => railsClient.get<any[]>('/institutions/passengers'),
    enabled: showAddPanel,
  });

  // 최적화
  const [optimizedResult, setOptimizedResult] = useState<OptimizationResult | null>(null);
  const optimizeMutation = useOptimizeRoute();
  const applyMutation    = useApplyOptimization(rosterId);

  const handleOptimize = async () => {
    try {
      const result = await optimizeMutation.mutateAsync(rosterId);
      setOptimizedResult(result);
    } catch {}
  };

  const handleApply = async () => {
    if (!optimizedResult) return;
    try {
      await applyMutation.mutateAsync({
        optimized_passengers: optimizedResult.optimized_passengers,
        total_distance_m:     optimizedResult.total_distance_m,
        total_duration_sec:   optimizedResult.total_duration_sec,
        distance_source:      optimizedResult.distance_source,
      });
      setOptimizedResult(null);
      router.push(`/institutions/${institutionId}/rosters`);
    } catch {}
  };

  // 절감 효과
  const savings = (() => {
    if (!optimizedResult || !preview?.total_distance_m) return null;
    const savedM = preview.total_distance_m - optimizedResult.total_distance_m;
    if (savedM <= 0) return null;
    return {
      saved_km: (savedM / 1000).toFixed(2),
      rate:     ((savedM / preview.total_distance_m) * 100).toFixed(1),
      fuel_krw: Math.floor((savedM / 1000 / 12) * 1650),
    };
  })();

  const formatDuration = (sec: number | null | undefined) => {
    if (!sec) return '-';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return s > 0 ? `${m}분 ${s}초` : `${m}분`;
  };

  const shuttleLabel = roster?.shuttle_type === 'morning' ? '등원' : '하원';

  if (isLoadingPreview) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-[#00A1E0]" />
      </div>
    );
  }

  const currentPassengers: RoutePreviewPassenger[] = preview?.passengers ?? [];
  const displayPassengers: (RoutePreviewPassenger | OptimizedPassenger)[] =
    optimizedResult
      ? optimizedResult.optimized_passengers
      : (manualOrder ?? currentPassengers);

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* ─── 헤더 ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push(`/institutions/${institutionId}/rosters`)}
          className="p-1.5 rounded-lg hover:bg-gray-100"
        >
          <ChevronLeft className="w-5 h-5 text-gray-500" strokeWidth={2} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-[#16325C]">운행 계획 상세</h1>
          <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-2">
            {roster?.vehicle?.plate_number && (
              <span className="flex items-center gap-1">
                <Car className="w-3.5 h-3.5" strokeWidth={2} />
                {roster.vehicle.plate_number}
              </span>
            )}
            {roster?.shuttle_type && (
              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                roster.shuttle_type === 'morning'
                  ? 'bg-blue-50 text-blue-700'
                  : 'bg-orange-50 text-orange-700'
              }`}>
                {shuttleLabel}
              </span>
            )}
            {roster?.week_start_date && (
              <span className="text-gray-400">{roster.week_start_date} 주</span>
            )}
          </p>
        </div>
      </div>

      {/* ─── 출발지 / 출발시간 ─────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-[#16325C] flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#00A1E0]" strokeWidth={2} />
            출발 정보
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
              <button onClick={() => setEditingDeparture(false)} className="text-xs text-gray-400 hover:text-gray-600">
                취소
              </button>
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
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <MapPin className="w-4 h-4 text-gray-400" strokeWidth={2} />
              {roster?.departure_address ?? <span className="text-gray-400 italic text-xs">출발지 미설정</span>}
            </div>
            {roster?.departure_time && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" strokeWidth={2} />
                <span className="text-sm font-semibold text-[#00A1E0]">{roster.departure_time} 출발</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── 탑승 시나리오 플로우 ──────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* 헤더 */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Route className="w-4 h-4 text-[#00A1E0]" strokeWidth={2} />
            <p className="text-sm font-semibold text-[#16325C]">
              탑승 시나리오
              {optimizedResult && (
                <span className="ml-2 text-xs text-[#00A1E0] font-normal">
                  — AI 최적화 적용됨
                </span>
              )}
              {isEditingOrder && !optimizedResult && (
                <span className="ml-2 text-xs text-amber-600 font-normal">
                  — 순서 편집 중
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {preview && (
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" strokeWidth={2} />
                  {currentPassengers.length}명
                </span>
                {(optimizedResult?.total_distance_km || preview.total_distance_km) && (
                  <span className="flex items-center gap-1">
                    <Route className="w-3.5 h-3.5" strokeWidth={2} />
                    {optimizedResult
                      ? `${optimizedResult.total_distance_km} km`
                      : `${preview.total_distance_km} km`}
                  </span>
                )}
              </div>
            )}
            {/* 승객 추가 버튼 */}
            {!optimizedResult && !isEditingOrder && (
              <button
                onClick={() => setShowAddPanel(v => !v)}
                className={`flex items-center gap-1 text-xs border px-2.5 py-1 rounded-lg transition-colors ${
                  showAddPanel
                    ? 'bg-[#00A1E0] text-white border-[#00A1E0]'
                    : 'text-gray-500 hover:text-[#00A1E0] border-gray-200 hover:border-[#00A1E0]'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" strokeWidth={2} />
                승객 추가
              </button>
            )}
            {/* 수동 순서 편집 버튼 — AI 최적화 중이 아닐 때만 표시 */}
            {!optimizedResult && !isEditingOrder && currentPassengers.length > 1 && (
              <button
                onClick={() => {
                  setManualOrder([...currentPassengers]);
                  setIsEditingOrder(true);
                }}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#00A1E0] border border-gray-200 hover:border-[#00A1E0] px-2.5 py-1 rounded-lg transition-colors"
              >
                <GripVertical className="w-3.5 h-3.5" strokeWidth={2} />
                순서 편집
              </button>
            )}
            {isEditingOrder && !optimizedResult && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setManualOrder(null); setIsEditingOrder(false); }}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveOrder}
                  disabled={reorderMutation.isPending || !manualOrder}
                  className="flex items-center gap-1 text-xs bg-[#00A1E0] text-white px-3 py-1 rounded-lg hover:bg-[#0081B3] disabled:opacity-50 transition-colors"
                >
                  {reorderMutation.isPending
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <Save className="w-3 h-3" strokeWidth={2} />}
                  저장
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 플로우 */}
        <div className="p-5">
          <div className="flex flex-col gap-0">
            {/* 출발지 노드 */}
            <FlowNode
              type="start"
              label={roster?.departure_address ?? '출발지'}
              sub={roster?.departure_time ? `${roster.departure_time} 출발` : undefined}
            />

            {/* 승객 노드 */}
            {displayPassengers.length === 0 ? (
              <div className="ml-6 my-3 text-xs text-gray-400 italic">
                승객이 없습니다. 승객 관리에서 추가해주세요.
              </div>
            ) : isEditingOrder && !optimizedResult ? (
              // ── 드래그&드롭 모드 ──
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={(manualOrder ?? currentPassengers).map(p => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {(manualOrder ?? currentPassengers).map((p, idx) => (
                    <SortablePassengerNode
                      key={p.id}
                      id={p.id}
                      order={idx + 1}
                      name={p.name}
                      address={p.pickup_address}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            ) : (
              // ── 일반 표시 모드 ──
              displayPassengers.map((p, idx) => {
                const order = 'boarding_order' in p ? (p.boarding_order ?? idx + 1) : idx + 1;
                const arrSec = 'estimated_arrival_sec' in p ? p.estimated_arrival_sec : null;
                const arrMin = arrSec ? Math.round(arrSec / 60) : null;
                return (
                  <PassengerNode
                    key={p.id}
                    order={order}
                    name={p.name}
                    address={p.pickup_address}
                    etaMin={arrMin}
                    isOptimized={!!optimizedResult}
                    onRemove={!optimizedResult ? () => removePassengerMutation.mutate(p.id) : undefined}
                    isRemoving={removePassengerMutation.isPending && removePassengerMutation.variables === p.id}
                  />
                );
              })
            )}

            {/* 도착지 노드 */}
            <FlowNode
              type="end"
              label="기관 도착"
              sub={optimizedResult
                ? `총 ${optimizedResult.total_distance_km} km · ${optimizedResult.total_duration_min}분 소요`
                : preview?.total_distance_km
                ? `총 ${preview.total_distance_km} km · ${formatDuration(preview.total_duration_sec)}`
                : undefined}
            />
          </div>
        </div>
      </div>

      {/* ─── 승객 추가 패널 ─────────────────────────────────────── */}
      {showAddPanel && !optimizedResult && (
        <AddPassengerPanel
          allPassengers={allPassengers ?? []}
          currentIds={currentPassengers.map(p => p.id)}
          onAdd={(id) => addPassengerMutation.mutate(id)}
          isAdding={addPassengerMutation.isPending}
        />
      )}

      {/* ─── 에러 메시지 ────────────────────────────────────────── */}
      {(optimizeMutation.error || applyMutation.error) && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={2} />
          {optimizeMutation.error
            ? 'VRP 서비스에 연결할 수 없습니다. 잠시 후 다시 시도하세요.'
            : '최적화 결과 적용에 실패했습니다.'}
        </div>
      )}

      {/* ─── 절감 효과 ──────────────────────────────────────────── */}
      {savings && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
            <TrendingDown className="w-4 h-4" strokeWidth={2} />
            AI 최적화 절감 효과
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500">거리 단축</p>
              <p className="text-xl font-bold text-green-700">{savings.saved_km} km</p>
              <p className="text-xs text-gray-400">{savings.rate}% 감소</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">연료비 절감</p>
              <p className="text-xl font-bold text-green-700">{savings.fuel_krw.toLocaleString()}원</p>
              <p className="text-xs text-gray-400">추정치</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">최적화율</p>
              <p className="text-xl font-bold text-green-700">{savings.rate}%</p>
              <p className="text-xs text-gray-400">원거리 대비</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── 액션 버튼 ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3 pb-6">
        <button
          onClick={handleOptimize}
          disabled={optimizeMutation.isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#00A1E0] text-white text-sm font-medium
                     rounded-lg hover:bg-[#0081B3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {optimizeMutation.isPending
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Zap className="w-4 h-4" strokeWidth={2} />}
          {optimizeMutation.isPending ? '최적화 중...' : 'AI 경로 최적화 실행'}
        </button>

        {optimizedResult && (
          <button
            onClick={handleApply}
            disabled={applyMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-medium
                       rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {applyMutation.isPending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <CheckCircle className="w-4 h-4" strokeWidth={2} />}
            {applyMutation.isPending ? '적용 중...' : '최적화 결과 확정'}
          </button>
        )}

        {optimizedResult && (
          <button
            onClick={() => setOptimizedResult(null)}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            초기화
          </button>
        )}
      </div>
    </div>
  );
}

// ─── 플로우 노드: 출발지 / 도착지 ────────────────────────────
function FlowNode({
  type, label, sub,
}: {
  type: 'start' | 'end';
  label: string;
  sub?: string;
}) {
  const isStart = type === 'start';
  return (
    <div className="flex items-stretch gap-0">
      {/* 타임라인 */}
      <div className="flex flex-col items-center w-10 flex-shrink-0">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isStart ? 'bg-[#00A1E0] text-white' : 'bg-green-500 text-white'
        }`}>
          {isStart
            ? <MapPin className="w-4 h-4" strokeWidth={2} />
            : <Flag className="w-4 h-4" strokeWidth={2} />}
        </div>
        {isStart && <div className="w-0.5 bg-gray-200 flex-1 my-1" />}
      </div>

      {/* 내용 */}
      <div className={`pb-4 pl-3 flex-1 ${isStart ? 'pt-1' : 'pt-1'}`}>
        <p className={`text-sm font-semibold ${isStart ? 'text-[#16325C]' : 'text-green-700'}`}>
          {label}
        </p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── 플로우 노드: 승객 픽업 ────────────────────────────────────
function PassengerNode({
  order, name, address, etaMin, isOptimized, onRemove, isRemoving,
}: {
  order: number;
  name: string;
  address: string | null;
  etaMin: number | null;
  isOptimized: boolean;
  onRemove?: () => void;
  isRemoving?: boolean;
}) {
  return (
    <div className="flex items-stretch gap-0 group/node">
      {/* 타임라인 */}
      <div className="flex flex-col items-center w-10 flex-shrink-0">
        <div className="w-0.5 bg-gray-200 h-2 flex-shrink-0" />
        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
          isOptimized
            ? 'bg-[#00A1E0]/10 text-[#00A1E0] ring-1 ring-[#00A1E0]/30'
            : 'bg-gray-100 text-gray-600'
        }`}>
          {isRemoving ? <Loader2 className="w-3 h-3 animate-spin" /> : order}
        </div>
        <div className="w-0.5 bg-gray-200 flex-1 my-1" />
      </div>

      {/* 내용 */}
      <div className="pb-3 pt-1 pl-3 flex-1 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#16325C]">{name}</p>
          {address && (
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 shrink-0" strokeWidth={2} />
              {address}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {etaMin !== null && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              isOptimized
                ? 'bg-[#00A1E0]/10 text-[#00A1E0] font-medium'
                : 'bg-gray-100 text-gray-500'
            }`}>
              +{etaMin}분
            </span>
          )}
          {onRemove && (
            <button
              onClick={onRemove}
              disabled={isRemoving}
              className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-all disabled:opacity-50"
              aria-label="탑승자 제거"
            >
              <X className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 승객 추가 패널 ──────────────────────────────────────────
function AddPassengerPanel({
  allPassengers, currentIds, onAdd, isAdding,
}: {
  allPassengers: any[];
  currentIds: number[];
  onAdd: (id: number) => void;
  isAdding: boolean;
}) {
  const [selectedId, setSelectedId] = useState<number | ''>('');
  const available = allPassengers
    .filter(p => p.is_active && !currentIds.includes(p.id))
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'));

  const selected = available.find(p => p.id === selectedId);

  const handleAdd = () => {
    if (!selectedId) return;
    onAdd(selectedId as number);
    setSelectedId('');
  };

  return (
    <div className="bg-white rounded-xl border border-[#00A1E0]/30 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        <UserPlus className="w-4 h-4 text-[#00A1E0]" strokeWidth={2} />
        <p className="text-sm font-semibold text-[#16325C]">탑승자 추가</p>
      </div>

      <div className="px-4 py-3 flex items-center gap-3">
        <select
          value={selectedId}
          onChange={e => setSelectedId(e.target.value === '' ? '' : Number(e.target.value))}
          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00A1E0]/30 bg-white"
        >
          <option value="">
            {available.length === 0
              ? allPassengers.length === 0 ? '로딩 중...' : '추가 가능한 승객 없음'
              : '승객 선택 (가나다순)'}
          </option>
          {available.map(p => (
            <option key={p.id} value={p.id}>
              {p.name}{p.pickup_address ? ` — ${p.pickup_address}` : ''}
            </option>
          ))}
        </select>
        <button
          onClick={handleAdd}
          disabled={!selectedId || isAdding}
          className="flex-shrink-0 flex items-center gap-1 text-xs bg-[#00A1E0] text-white px-3 py-2 rounded-lg hover:bg-[#0081B3] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isAdding
            ? <Loader2 className="w-3 h-3 animate-spin" />
            : <UserPlus className="w-3 h-3" strokeWidth={2} />}
          추가
        </button>
      </div>
    </div>
  );
}

function formatDuration(sec: number | null | undefined): string {
  if (!sec) return '-';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${m}분 ${s}초` : `${m}분`;
}

// ─── 드래그 가능한 승객 노드 ────────────────────────────────
function SortablePassengerNode({
  id, order, name, address,
}: {
  id: number;
  order: number;
  name: string;
  address: string | null;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-stretch gap-0">
      {/* 타임라인 */}
      <div className="flex flex-col items-center w-10 flex-shrink-0">
        <div className="w-0.5 bg-gray-200 h-2 flex-shrink-0" />
        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold bg-amber-50 text-amber-600 ring-1 ring-amber-300">
          {order}
        </div>
        <div className="w-0.5 bg-gray-200 flex-1 my-1" />
      </div>

      {/* 내용 */}
      <div className="pb-3 pt-1 pl-3 flex-1 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#16325C]">{name}</p>
          {address && (
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 shrink-0" strokeWidth={2} />
              {address}
            </p>
          )}
        </div>
        {/* 드래그 핸들 */}
        <button
          {...attributes}
          {...listeners}
          className="flex-shrink-0 p-1.5 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none"
          aria-label="드래그하여 순서 변경"
        >
          <GripVertical className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
