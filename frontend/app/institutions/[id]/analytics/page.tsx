'use client';

import { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import {
  useAnalyticsOverview,
  useTripTrends,
  useSafetyAnalytics,
  usePassengerAnalytics,
} from '@/hooks/queries/use-analytics';
import { railsClient } from '@/lib/rails-client';
import {
  BarChart2,
  Clock,
  MapPin,
  Users,
  TrendingUp,
  Shield,
  Download,
  Loader2,
  RefreshCw,
} from 'lucide-react';

/**
 * BI 대시보드 — Epic 10
 *
 * 탭:
 *  운행 현황 — KPI 카드 + 정시 도착률 트렌드 + 취소율 트렌드
 *  안전 분석 — 안전 점수 트렌드 + 이벤트 유형별 월간 집계
 */
export default function AnalyticsDashboardPage() {
  const [activeTab, setActiveTab] = useState<'operations' | 'safety'>('operations');
  const [isExporting, setIsExporting] = useState(false);

  const { data: overview, isLoading: loadingOverview } = useAnalyticsOverview();
  const { data: tripData,  isLoading: loadingTrips }   = useTripTrends(12);
  const { data: safetyData, isLoading: loadingSafety } = useSafetyAnalytics();
  const { data: passengerData }                        = usePassengerAnalytics();

  const isLoading = loadingOverview || loadingTrips;

  // ─── CSV 내보내기 ──────────────────────────────────────────────
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_RAILS_API_URL ?? 'http://localhost:3001'}/api/v1/institutions/analytics/export`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('rails_access_token') ?? ''}`,
          },
        }
      );
      const blob = await response.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `운행내역_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#16325C]">BI 대시보드</h1>
          <p className="text-sm text-gray-500 mt-1">
            {overview?.data_range_days === 'all'
              ? '전체 데이터'
              : `최근 ${overview?.data_range_days}일 데이터`}
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600
                     hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {isExporting
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Download className="w-4 h-4" strokeWidth={2} />}
          CSV 내보내기
        </button>
      </div>

      {/* ─── KPI 카드 ────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-[#00A1E0]" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            icon={<TrendingUp className="w-5 h-5 text-[#00A1E0]" strokeWidth={2} />}
            label="정시 도착률"
            value={overview?.ontime_rate != null ? `${overview.ontime_rate}%` : '-'}
            sub={`완료 운행 ${overview?.completed_trips ?? 0}회`}
            highlight={overview?.ontime_rate != null && overview.ontime_rate >= 90}
          />
          <KpiCard
            icon={<Clock className="w-5 h-5 text-purple-500" strokeWidth={2} />}
            label="평균 운행 시간"
            value={overview?.avg_trip_duration_min != null ? `${overview.avg_trip_duration_min}분` : '-'}
            sub={`전체 운행 ${overview?.total_trips ?? 0}회`}
          />
          <KpiCard
            icon={<MapPin className="w-5 h-5 text-green-500" strokeWidth={2} />}
            label="총 운행 거리"
            value={overview?.total_distance_km != null ? `${overview.total_distance_km} km` : '-'}
            sub="최적화 기준"
          />
          <KpiCard
            icon={<Users className="w-5 h-5 text-amber-500" strokeWidth={2} />}
            label="승차 완료율"
            value={overview?.boarding_completion_rate != null ? `${overview.boarding_completion_rate}%` : '-'}
            sub={`하차 완료율 ${overview?.alighting_rate ?? '-'}%`}
          />
        </div>
      )}

      {/* ─── 탭 ─────────────────────────────────────────────────── */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1">
          {[
            { id: 'operations', label: '운행 현황', icon: BarChart2 },
            { id: 'safety',     label: '안전 분석', icon: Shield },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === id
                  ? 'border-[#00A1E0] text-[#00A1E0]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" strokeWidth={2} />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* ─── 운행 현황 탭 ────────────────────────────────────────── */}
      {activeTab === 'operations' && (
        <div className="space-y-6">
          {/* 정시 도착률 트렌드 */}
          <ChartCard
            title="정시 도착률 트렌드"
            subtitle="최근 12주 운행 정시율 (허용 오차 ±10분)"
            isLoading={loadingTrips}
          >
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={tripData?.weekly_trends ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="week_label" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip
                  formatter={(v: number) => [`${v}%`, '정시 도착률']}
                  labelFormatter={(l) => `주간 ${l}`}
                />
                <ReferenceLine y={90} stroke="#22c55e" strokeDasharray="4 4" label={{ value: '목표 90%', position: 'right', fontSize: 10 }} />
                <Line
                  type="monotone"
                  dataKey="ontime_rate"
                  stroke="#00A1E0"
                  strokeWidth={2}
                  dot={{ fill: '#00A1E0', r: 3 }}
                  activeDot={{ r: 5 }}
                  name="정시율"
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* 운행 횟수 트렌드 */}
          <ChartCard
            title="주간 운행 횟수"
            subtitle="전체 운행 vs 완료 운행"
            isLoading={loadingTrips}
          >
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={tripData?.weekly_trends ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="week_label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="total_trips" name="전체 운행" fill="#e2e8f0" radius={[3, 3, 0, 0]} />
                <Bar dataKey="ontime_trips" name="완료 운행" fill="#00A1E0" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* 취소율 트렌드 */}
          <ChartCard
            title="주간 결석/취소율"
            subtitle="체크인 중 absent 비율"
            isLoading={false}
          >
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={passengerData?.weekly_cancellations ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="week_label" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 30]} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip
                  formatter={(v: number) => [`${v}%`, '취소율']}
                  labelFormatter={(l) => `주간 ${l}`}
                />
                <Line
                  type="monotone"
                  dataKey="cancellation_rate"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ fill: '#f59e0b', r: 3 }}
                  name="취소율"
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* ─── 안전 분석 탭 ────────────────────────────────────────── */}
      {activeTab === 'safety' && (
        <div className="space-y-6">
          {/* 안전 점수 주간 트렌드 */}
          <ChartCard
            title="드라이버 평균 안전 점수"
            subtitle="기관 전체 드라이버 평균 (100점 만점)"
            isLoading={loadingSafety}
          >
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={safetyData?.weekly_scores ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="week_label" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v: number) => [v.toFixed(1), '평균 안전 점수']}
                  labelFormatter={(l) => `주간 ${l}`}
                />
                <ReferenceLine y={75} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'B등급 기준', position: 'right', fontSize: 10 }} />
                <Line
                  type="monotone"
                  dataKey="avg_score"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ fill: '#8b5cf6', r: 3 }}
                  name="평균 점수"
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* 이벤트 유형별 월간 집계 */}
          <ChartCard
            title="안전 이벤트 유형별 추이"
            subtitle="최근 6개월 운전 이벤트 발생 현황"
            isLoading={loadingSafety}
          >
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={safetyData?.monthly_events ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="harsh_accel" name="급가속"  fill="#f87171" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="harsh_brake" name="급제동"  fill="#fb923c" stackId="a" />
                <Bar dataKey="speeding"    name="과속"    fill="#fbbf24" stackId="a" />
                <Bar dataKey="idling"      name="공회전"  fill="#a3e635" stackId="a" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* 주간 안전 점수 상세 테이블 */}
          {safetyData && safetyData.weekly_scores.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <p className="text-sm font-semibold text-gray-700">주간 안전 점수 상세</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">주차</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase">드라이버 수</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase">평균 점수</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase">등급</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {[...safetyData.weekly_scores].reverse().map((row, i) => {
                      const score = row.avg_score;
                      const grade = !score ? '-' : score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : 'D';
                      const gradeColor = grade === 'A' ? 'text-green-600 bg-green-50'
                        : grade === 'B' ? 'text-blue-600 bg-blue-50'
                        : grade === 'C' ? 'text-yellow-600 bg-yellow-50'
                        : grade === 'D' ? 'text-red-600 bg-red-50'
                        : 'text-gray-400 bg-gray-50';
                      return (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-2.5 text-gray-700">{row.week_label} 주</td>
                          <td className="px-4 py-2.5 text-right text-gray-600">{row.driver_count}명</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-[#16325C]">
                            {score != null ? score.toFixed(1) : '-'}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${gradeColor}`}>
                              {grade}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── 서브 컴포넌트: KPI 카드 ──────────────────────────────────────
function KpiCard({
  icon, label, value, sub, highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`bg-white rounded-lg border p-4 ${highlight ? 'border-green-200' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <div className="p-1.5 rounded-lg bg-gray-50">{icon}</div>
      </div>
      <p className={`text-2xl font-bold ${highlight ? 'text-green-600' : 'text-[#16325C]'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

// ─── 서브 컴포넌트: 차트 카드 ─────────────────────────────────────
function ChartCard({
  title, subtitle, isLoading, children,
}: {
  title: string;
  subtitle?: string;
  isLoading: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="mb-4">
        <p className="text-sm font-semibold text-[#16325C]">{title}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="w-5 h-5 animate-spin text-[#00A1E0]" />
        </div>
      ) : (
        children
      )}
    </div>
  );
}
