'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { railsClient } from '@/lib/rails-client';
import {
  MapPin,
  Car,
  User,
  Calendar,
  ChevronRight,
  Users,
  Filter,
} from 'lucide-react';

interface TripItem {
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
}

const SHUTTLE_LABELS: Record<string, string> = {
  morning: '등원',
  evening: '하원',
  temporary: '임시',
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: '예정',
  in_progress: '운행중',
  completed: '완료',
  cancelled: '취소',
};

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const SHUTTLE_COLORS: Record<string, string> = {
  morning: 'bg-orange-100 text-orange-700',
  evening: 'bg-purple-100 text-purple-700',
  temporary: 'bg-yellow-100 text-yellow-700',
};

export default function TripsPage() {
  const params = useParams();
  const router = useRouter();
  const institutionId = params.id as string;

  const today = new Date().toISOString().slice(0, 7); // YYYY-MM
  const [month, setMonth] = useState(today);
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['trips', institutionId, month, status],
    queryFn: () => {
      const p: Record<string, string | number> = { month };
      if (status) p.status = status;
      return railsClient.get<TripItem[]>('/institutions/trips', p);
    },
  });

  const trips: TripItem[] = data ?? [];

  const stats = {
    total: trips.length,
    completed: trips.filter((t) => t.status === 'completed').length,
    in_progress: trips.filter((t) => t.status === 'in_progress').length,
    cancelled: trips.filter((t) => t.status === 'cancelled').length,
  };

  const formatTime = (iso: string | null) => {
    if (!iso) return '-';
    return new Date(iso).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">운행 이력</h1>
        <p className="text-sm text-slate-500 mt-1">월별 운행 기록을 조회합니다.</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Filter className="w-4 h-4 text-slate-400" />
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-600">월 선택</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-600">상태</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체</option>
              <option value="scheduled">예정</option>
              <option value="in_progress">운행중</option>
              <option value="completed">완료</option>
              <option value="cancelled">취소</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '전체', value: stats.total, color: 'text-slate-700', bg: 'bg-slate-50' },
          { label: '완료', value: stats.completed, color: 'text-green-700', bg: 'bg-green-50' },
          { label: '운행중', value: stats.in_progress, color: 'text-blue-700', bg: 'bg-blue-50' },
          { label: '취소', value: stats.cancelled, color: 'text-red-700', bg: 'bg-red-50' },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4`}>
            <div className="text-sm text-slate-500">{s.label}</div>
            <div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Trip List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-slate-400">
            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : trips.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2">
            <MapPin className="w-8 h-8" />
            <p>운행 이력이 없습니다.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">날짜</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">구분</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">상태</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">차량</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">기사</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">탑승</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">출발</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">종료</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {trips.map((trip) => (
                <tr
                  key={trip.id}
                  onClick={() =>
                    router.push(`/institutions/${institutionId}/trips/${trip.id}`)
                  }
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {formatDate(trip.trip_date)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        SHUTTLE_COLORS[trip.shuttle_type] ?? 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {SHUTTLE_LABELS[trip.shuttle_type] ?? trip.shuttle_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        STATUS_COLORS[trip.status] ?? 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {STATUS_LABELS[trip.status] ?? trip.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                      <Car className="w-4 h-4 text-slate-400" />
                      {trip.vehicle.plate_number ?? `****${trip.vehicle.plate_last4}`}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                      <User className="w-4 h-4 text-slate-400" />
                      {trip.driver.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-sm text-slate-600">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span className="font-medium text-slate-900">{trip.boarded_count}</span>
                      <span className="text-slate-400">/{trip.total_passengers}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{formatTime(trip.started_at)}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{formatTime(trip.ended_at)}</td>
                  <td className="px-4 py-3">
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
