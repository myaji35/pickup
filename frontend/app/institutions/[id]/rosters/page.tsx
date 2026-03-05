'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { railsClient } from '@/lib/rails-client';
import {
  Loader2, Route, Calendar, Users, ChevronRight, Zap,
  Clock, MapPin, Plus, Car, ArrowRight, CheckCircle2,
  X, ChevronDown,
} from 'lucide-react';

interface Vehicle {
  id: number;
  plate_number: string;
  plate_last4: string;
  capacity: number;
}

interface Roster {
  id: number;
  week_start_date: string;
  shuttle_type: string;
  vehicle: { id: number; plate_last4: string; plate_number: string; capacity: number };
  passengers_count: number;
  departure_address: string | null;
  departure_time: string | null;
  last_optimized_at: string | null;
  optimized_distance_m: number | null;
  created_at: string;
}

const SHUTTLE_LABEL: Record<string, string> = {
  morning: '등원',
  evening: '하원',
};

function getWeekLabel(dateStr: string) {
  const d = new Date(dateStr);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${m}월 ${day}일 주`;
}

/**
 * 운행 계획 목록 — Roster 기반 운행 시나리오 관리
 */
export default function RostersPage() {
  const params = useParams();
  const institutionId = params.id as string;
  const qc = useQueryClient();

  const [showNewForm, setShowNewForm] = useState(false);
  const [newWeek, setNewWeek] = useState('');
  const [newVehicleId, setNewVehicleId] = useState('');
  const [newShuttleType, setNewShuttleType] = useState('morning');
  const [newDepartureTime, setNewDepartureTime] = useState('07:30');
  const [newDepartureAddress, setNewDepartureAddress] = useState('');

  // 로스터 목록
  const { data, isLoading, error } = useQuery({
    queryKey: ['rosters', institutionId],
    queryFn: () => railsClient.get<Roster[]>('/institutions/rosters'),
  });

  // 차량 목록 (새 운행계획 생성용)
  const { data: vehicles } = useQuery({
    queryKey: ['vehicles', institutionId],
    queryFn: () => railsClient.get<any[]>('/institutions/vehicles'),
    enabled: showNewForm,
  });

  const rosters: Roster[] = Array.isArray(data) ? data : [];

  // 새 운행계획 생성
  const createMutation = useMutation({
    mutationFn: () =>
      railsClient.post('/institutions/rosters', {
        roster: {
          week_start_date: newWeek,
          vehicle_id: newVehicleId,
          shuttle_type: newShuttleType,
          departure_time: newDepartureTime,
          departure_address: newDepartureAddress,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rosters', institutionId] });
      setShowNewForm(false);
      setNewWeek('');
      setNewVehicleId('');
      setNewShuttleType('morning');
      setNewDepartureTime('07:30');
      setNewDepartureAddress('');
    },
  });

  // 주간별 그룹핑
  const grouped = rosters.reduce<Record<string, Roster[]>>((acc, r) => {
    const key = r.week_start_date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  const sortedWeeks = Object.keys(grouped).sort((a, b) => (a > b ? -1 : 1));

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#16325C]">운행 계획</h1>
          <p className="text-sm text-gray-500 mt-1">
            주차별 운행 그룹을 관리하고 AI 경로 최적화를 실행하세요
          </p>
        </div>
        <button
          onClick={() => setShowNewForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#00A1E0] text-white text-sm font-medium rounded-lg hover:bg-[#0081B3] transition-colors"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          운행계획 추가
        </button>
      </div>

      {/* 새 운행계획 생성 폼 */}
      {showNewForm && (
        <div className="bg-white rounded-xl border border-[#00A1E0]/30 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-[#16325C]">새 운행계획</p>
            <button onClick={() => setShowNewForm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">주 시작일</label>
              <input
                type="date"
                value={newWeek}
                onChange={e => setNewWeek(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00A1E0]/30"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">차량</label>
              <select
                value={newVehicleId}
                onChange={e => setNewVehicleId(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00A1E0]/30"
              >
                <option value="">차량 선택</option>
                {(vehicles ?? []).map((v: any) => (
                  <option key={v.id} value={v.id}>
                    {v.plate_number} ({v.capacity}인승)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">운행 유형</label>
              <select
                value={newShuttleType}
                onChange={e => setNewShuttleType(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00A1E0]/30"
              >
                <option value="morning">등원</option>
                <option value="evening">하원</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">출발시간</label>
              <input
                type="time"
                value={newDepartureTime}
                onChange={e => setNewDepartureTime(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00A1E0]/30"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">출발지 주소</label>
              <input
                type="text"
                value={newDepartureAddress}
                onChange={e => setNewDepartureAddress(e.target.value)}
                placeholder="예: 서울시 마포구 햇살 어린이집"
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00A1E0]/30"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !newWeek || !newVehicleId}
              className="flex items-center gap-2 px-4 py-2 bg-[#00A1E0] text-white text-sm font-medium rounded-lg hover:bg-[#0081B3] disabled:opacity-50 transition-colors"
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" strokeWidth={2} />}
              생성
            </button>
            <button onClick={() => setShowNewForm(false)} className="text-sm text-gray-400 hover:text-gray-600">취소</button>
          </div>
          {createMutation.isError && (
            <p className="mt-2 text-xs text-red-500">생성에 실패했습니다. 입력값을 확인하세요.</p>
          )}
        </div>
      )}

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
              각 운행 계획 카드를 선택하면 탑승 시나리오와 AI 최적화를 실행할 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      {/* 로딩 / 에러 / 목록 */}
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
          <Route className="w-10 h-10 mx-auto mb-3 text-gray-300" strokeWidth={1.5} />
          <p>등록된 운행 계획이 없습니다.</p>
          <button
            onClick={() => setShowNewForm(true)}
            className="mt-3 text-[#00A1E0] text-sm font-medium hover:underline"
          >
            첫 운행 계획 추가하기
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedWeeks.map((week) => (
            <WeekGroup
              key={week}
              week={week}
              rosters={grouped[week]}
              institutionId={institutionId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 주간 그룹 ────────────────────────────────────────────
function WeekGroup({
  week, rosters, institutionId,
}: {
  week: string;
  rosters: Roster[];
  institutionId: string;
}) {
  const [open, setOpen] = useState(true);
  const optimized = rosters.filter(r => r.last_optimized_at).length;

  return (
    <div>
      {/* 주차 헤더 */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-1 py-2 mb-2"
      >
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-gray-400" strokeWidth={2} />
          <span className="text-sm font-semibold text-[#16325C]">{getWeekLabel(week)}</span>
          <span className="text-xs text-gray-400">{rosters.length}개 운행</span>
          {optimized > 0 && (
            <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              {optimized}/{rosters.length} 최적화완료
            </span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} strokeWidth={2} />
      </button>

      {open && (
        <div className="space-y-3">
          {rosters.map(roster => (
            <RosterCard key={roster.id} roster={roster} institutionId={institutionId} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 운행 계획 카드 ────────────────────────────────────────
function RosterCard({ roster, institutionId }: { roster: Roster; institutionId: string }) {
  const distKm = roster.optimized_distance_m ? (roster.optimized_distance_m / 1000).toFixed(1) : null;

  return (
    <Link
      href={`/institutions/${institutionId}/rosters/${roster.id}/optimize`}
      className="block"
    >
      <div className="bg-white rounded-xl border border-gray-200 hover:border-[#00A1E0] hover:shadow-md transition-all group">
        {/* 상단 컬러 바: 등원=파란, 하원=오렌지 */}
        <div className={`h-1 rounded-t-xl ${roster.shuttle_type === 'morning' ? 'bg-[#00A1E0]' : 'bg-orange-400'}`} />

        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            {/* 좌: 아이콘 + 정보 */}
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 group-hover:bg-[#00A1E0]/10 mt-0.5 flex-shrink-0">
                <Car className="w-4 h-4 text-[#00A1E0]" strokeWidth={2} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-[#16325C]">{roster.vehicle.plate_number}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    roster.shuttle_type === 'morning'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-orange-50 text-orange-700'
                  }`}>
                    {SHUTTLE_LABEL[roster.shuttle_type] ?? roster.shuttle_type}
                  </span>
                  <span className="text-xs text-gray-400">({roster.vehicle.capacity}인승)</span>
                </div>

                {/* 탑승 시나리오 미니 플로우 */}
                <div className="flex items-center gap-1 mt-2 flex-wrap">
                  {/* 출발지 */}
                  {roster.departure_address ? (
                    <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                      <MapPin className="w-3 h-3" strokeWidth={2} />
                      {roster.departure_address.length > 12
                        ? roster.departure_address.slice(0, 12) + '…'
                        : roster.departure_address}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400 italic">출발지 미설정</span>
                  )}

                  {roster.passengers_count > 0 && (
                    <>
                      <ArrowRight className="w-3 h-3 text-gray-300 flex-shrink-0" strokeWidth={2} />
                      <span className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        <Users className="w-3 h-3" strokeWidth={2} />
                        {roster.passengers_count}명 탑승
                      </span>
                    </>
                  )}

                  <ArrowRight className="w-3 h-3 text-gray-300 flex-shrink-0" strokeWidth={2} />
                  <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">기관 도착</span>
                </div>

                {/* 출발 시간 */}
                {roster.departure_time && (
                  <p className="flex items-center gap-1 mt-1.5 text-xs text-[#00A1E0] font-semibold">
                    <Clock className="w-3 h-3" strokeWidth={2} />
                    {roster.departure_time} 출발
                  </p>
                )}
              </div>
            </div>

            {/* 우: 최적화 상태 + 화살표 */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {roster.last_optimized_at ? (
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" strokeWidth={2} />
                    <p className="text-xs text-green-600 font-medium">최적화완료</p>
                  </div>
                  {distKm && (
                    <p className="text-xs text-gray-400 mt-0.5">{distKm} km</p>
                  )}
                </div>
              ) : (
                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                  미최적화
                </span>
              )}
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#00A1E0] transition-colors" strokeWidth={2} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
