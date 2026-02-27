'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { railsClient } from '@/lib/rails-client';
import {
  ArrowLeft,
  Car,
  User,
  Calendar,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Fuel,
} from 'lucide-react';

interface CheckIn {
  id: number;
  passenger_id: number;
  passenger_name: string;
  status: string;
  source: string;
  boarded_at: string | null;
  alighted_at: string | null;
}

interface TripDetail {
  id: number;
  trip_date: string;
  shuttle_type: string;
  status: string;
  started_at: string | null;
  ended_at: string | null;
  vehicle: { id: number; plate_last4: string; plate_number: string | null };
  driver: { id: number; name: string };
  total_passengers: number;
  boarded_count: number;
  check_ins: CheckIn[];
  last_fuel_level: number | null;
  obd_updated_at: string | null;
}

const CHECK_IN_STATUS: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: '대기', color: 'text-slate-500', icon: AlertCircle },
  boarded: { label: '탑승', color: 'text-green-600', icon: CheckCircle },
  alighted: { label: '하차', color: 'text-blue-600', icon: CheckCircle },
  absent: { label: '결석', color: 'text-red-500', icon: XCircle },
};

const SHUTTLE_LABELS: Record<string, string> = { morning: '등원', evening: '하원', temporary: '임시' };
const STATUS_LABELS: Record<string, string> = {
  scheduled: '예정', in_progress: '운행중', completed: '완료', cancelled: '취소',
};
const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const institutionId = params.id as string;
  const tripId = params.tripId as string;

  const { data, isLoading } = useQuery({
    queryKey: ['trip', institutionId, tripId],
    queryFn: () => railsClient.get<{ success: boolean; data: TripDetail }>(`/institutions/trips/${tripId}`),
  });

  const trip: TripDetail | undefined = data?.data;

  const formatDateTime = (iso: string | null) => {
    if (!iso) return '-';
    return new Date(iso).toLocaleString('ko-KR', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
    });
  };

  const calcDuration = (start: string | null, end: string | null) => {
    if (!start || !end) return null;
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const mins = Math.floor(diff / 60000);
    return `${mins}분`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="p-6 text-center text-slate-500">운행 정보를 찾을 수 없습니다.</div>
    );
  }

  const duration = calcDuration(trip.started_at, trip.ended_at);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push(`/institutions/${institutionId}/trips`)}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">운행 상세</h1>
          <p className="text-sm text-slate-500 mt-0.5">{formatDate(trip.trip_date)}</p>
        </div>
        <div className="ml-auto">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[trip.status] ?? 'bg-gray-100 text-gray-700'}`}>
            {STATUS_LABELS[trip.status] ?? trip.status}
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
            <Car className="w-4 h-4" />
            차량
          </div>
          <div className="font-semibold text-slate-900">
            {trip.vehicle.plate_number ?? `****${trip.vehicle.plate_last4}`}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
            <User className="w-4 h-4" />
            기사
          </div>
          <div className="font-semibold text-slate-900">{trip.driver.name}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
            <Users className="w-4 h-4" />
            탑승 현황
          </div>
          <div className="font-semibold text-slate-900">
            {trip.boarded_count}
            <span className="text-slate-400 font-normal text-sm ml-1">/ {trip.total_passengers}명</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
            <Clock className="w-4 h-4" />
            운행 시간
          </div>
          <div className="font-semibold text-slate-900">{duration ?? '-'}</div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">운행 타임라인</h2>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-xs text-slate-400 mb-1">출발</div>
            <div className="font-medium text-slate-900">{formatDateTime(trip.started_at)}</div>
          </div>
          <div className="flex-1 h-0.5 bg-slate-200 relative">
            {trip.status === 'completed' && (
              <div className="absolute inset-0 bg-green-500" />
            )}
            {trip.status === 'in_progress' && (
              <div className="absolute left-0 top-0 h-full w-1/2 bg-blue-500 animate-pulse" />
            )}
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-400 mb-1">도착</div>
            <div className="font-medium text-slate-900">{formatDateTime(trip.ended_at)}</div>
          </div>
        </div>
      </div>

      {/* OBD Info */}
      {(trip.last_fuel_level !== null || trip.obd_updated_at) && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Fuel className="w-4 h-4 text-slate-400" />
            OBD 정보
          </h2>
          <div className="flex items-center gap-6">
            {trip.last_fuel_level !== null && (
              <div>
                <div className="text-xs text-slate-400 mb-1">연료 잔량</div>
                <div className="font-semibold text-slate-900">{trip.last_fuel_level}%</div>
              </div>
            )}
            {trip.obd_updated_at && (
              <div>
                <div className="text-xs text-slate-400 mb-1">마지막 업데이트</div>
                <div className="text-sm text-slate-600">{formatDateTime(trip.obd_updated_at)}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Check-ins Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            승객 체크인 목록
          </h2>
          <span className="text-sm text-slate-500">
            {trip.check_ins.length}명
          </span>
        </div>
        {trip.check_ins.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 text-slate-400 gap-1">
            <p className="text-sm">체크인 기록이 없습니다.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">승객</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">상태</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">방식</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">탑승 시각</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">하차 시각</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {trip.check_ins.map((ci: CheckIn) => {
                const statusInfo = CHECK_IN_STATUS[ci.status] ?? CHECK_IN_STATUS.pending;
                const Icon = statusInfo.icon;
                return (
                  <tr key={ci.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">{ci.passenger_name}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-sm font-medium ${statusInfo.color}`}>
                        <Icon className="w-4 h-4" />
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500 capitalize">{ci.source ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {ci.boarded_at ? new Date(ci.boarded_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {ci.alighted_at ? new Date(ci.alighted_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
