'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Bell,
  BellOff,
  CheckCircle,
  XCircle,
  TrendingUp,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { railsClient } from '@/lib/rails-client';

// ─────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────

interface NotificationLog {
  id: number;
  notification_type: string;
  title: string;
  body: string;
  status: 'sent' | 'failed';
  created_at: string;
}

interface NotificationStats {
  total_sent: number;
  total_failed: number;
  by_type: Record<string, number>;
  daily_counts: Record<string, number>;
}

// ─────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  trip_started:    '운행 시작',
  boarded:         '탑승 확인',
  alighted:        '하차 확인',
  eta_approaching: '도착 예정',
  dtc_alert:       '차량 이상',
};

const TYPE_COLOR: Record<string, string> = {
  trip_started:    '#2563eb',
  boarded:         '#16a34a',
  alighted:        '#7c3aed',
  eta_approaching: '#ea580c',
  dtc_alert:       '#dc2626',
};

function formatKo(isoStr: string): string {
  const d = new Date(isoStr);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

// ─────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────

export default function NotificationsPage() {
  const { id: institutionId } = useParams() as { id: string };
  const [logs, setLogs]         = useState<NotificationLog[]>([]);
  const [stats, setStats]       = useState<NotificationStats | null>(null);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeType, setActiveType] = useState<string>('all');

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const [logsData, statsData] = await Promise.all([
        railsClient.get<NotificationLog[]>('/institutions/notifications'),
        railsClient.get<NotificationStats>('/institutions/notifications/stats'),
      ]);
      setLogs(logsData);
      setStats(statsData);
    } catch (e) {
      console.error('알림 이력 로드 실패:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, [institutionId]);

  // 차트 데이터 변환 (일별 추이)
  const chartData = stats
    ? Object.entries(stats.daily_counts).map(([date, count]) => ({
        date: date.slice(5), // MM-DD
        count,
      }))
    : [];

  // 알림 유형별 비율 데이터
  const typeData = stats
    ? Object.entries(stats.by_type).map(([type, count]) => ({
        name: TYPE_LABELS[type] ?? type,
        count,
        fill: TYPE_COLOR[type] ?? '#94a3b8',
      }))
    : [];

  // 필터링된 로그
  const filteredLogs = activeType === 'all'
    ? logs
    : logs.filter((l) => l.notification_type === activeType);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">알림 현황</h1>
          <p className="text-sm text-gray-500 mt-1">FCM 푸시 알림 발송 이력 (최근 200건)</p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          새로고침
        </button>
      </div>

      {/* KPI 카드 */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">7일 총 발송</span>
              <Bell className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.total_sent + stats.total_failed}</p>
            <p className="text-xs text-gray-400 mt-1">최근 7일</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">성공</span>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-green-600">{stats.total_sent}</p>
            <p className="text-xs text-gray-400 mt-1">
              성공률{' '}
              {stats.total_sent + stats.total_failed > 0
                ? Math.round((stats.total_sent / (stats.total_sent + stats.total_failed)) * 100)
                : 0}
              %
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">실패</span>
              <XCircle className="w-5 h-5 text-red-400" />
            </div>
            <p className="text-3xl font-bold text-red-500">{stats.total_failed}</p>
            <p className="text-xs text-gray-400 mt-1">재시도 필요</p>
          </div>
        </div>
      )}

      {/* 차트 2열 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 일별 발송 추이 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <h2 className="text-sm font-semibold text-gray-700">일별 발송 추이</h2>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" name="발송 수" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              데이터 없음
            </div>
          )}
        </div>

        {/* 유형별 발송 수 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-4 h-4 text-blue-500" />
            <h2 className="text-sm font-semibold text-gray-700">알림 유형별 발송</h2>
          </div>
          {typeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={typeData} layout="vertical" margin={{ top: 0, right: 10, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={70} />
                <Tooltip />
                <Bar dataKey="count" name="건수" radius={[0, 3, 3, 0]}>
                  {typeData.map((entry, index) => (
                    <rect key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              데이터 없음
            </div>
          )}
        </div>
      </div>

      {/* 알림 이력 테이블 */}
      <div className="bg-white rounded-xl border border-gray-200">
        {/* 테이블 헤더 + 필터 */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">발송 이력</h2>
          <div className="flex items-center gap-2 flex-wrap">
            {['all', ...Object.keys(TYPE_LABELS)].map((type) => (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  activeType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {type === 'all' ? '전체' : TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
            <BellOff className="w-10 h-10" />
            <p className="text-sm">발송 이력이 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">유형</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">제목</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">내용</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">상태</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">발송 시각</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <span
                        className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: (TYPE_COLOR[log.notification_type] ?? '#94a3b8') + '20',
                          color: TYPE_COLOR[log.notification_type] ?? '#64748b',
                        }}
                      >
                        {TYPE_LABELS[log.notification_type] ?? log.notification_type}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-800 font-medium">{log.title}</td>
                    <td className="px-5 py-3 text-gray-500 max-w-xs truncate">{log.body}</td>
                    <td className="px-5 py-3">
                      {log.status === 'sent' ? (
                        <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                          <CheckCircle className="w-3.5 h-3.5" />
                          성공
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-500 text-xs font-medium">
                          <XCircle className="w-3.5 h-3.5" />
                          실패
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{formatKo(log.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
