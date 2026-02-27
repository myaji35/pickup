'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useSafetyScores, useSafetySummary } from '@/hooks/queries/use-safety';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Shield, TrendingDown, AlertTriangle, Car } from 'lucide-react';
import Link from 'next/link';

/**
 * 안전 대시보드 메인 — Epic 7 Phase B
 * 드라이버 주간 안전 점수 랭킹 + 30일 요약
 */
export default function SafetyDashboardPage() {
  const params = useParams();
  const institutionId = params.id as string;

  const now = new Date();
  const [year] = useState(now.getFullYear());
  // ISO week 계산
  const [week] = useState(() => {
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  });

  const { data: scoresData, isLoading: isLoadingScores } = useSafetyScores(year, week);
  const { data: summary, isLoading: isLoadingSummary } = useSafetySummary();

  const EVENT_TYPE_KR: Record<string, string> = {
    harsh_accel: '급가속',
    harsh_brake: '급제동',
    speeding: '과속',
    idling: '공회전',
  };

  const scoreGrade = (score: number) => {
    if (score >= 90) return { label: 'A', color: 'bg-green-100 text-green-800' };
    if (score >= 75) return { label: 'B', color: 'bg-blue-100 text-blue-800' };
    if (score >= 60) return { label: 'C', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'D', color: 'bg-red-100 text-red-800' };
  };

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            안전 대시보드
          </h1>
          <p className="text-sm text-gray-500 mt-1">{year}년 {week}주차 드라이버 안전 점수</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/institutions/${institutionId}/safety/events`}
            className="text-sm px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            이벤트 목록
          </Link>
          <Link
            href={`/institutions/${institutionId}/safety/dtc`}
            className="text-sm px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            DTC 이력
          </Link>
        </div>
      </div>

      {/* 30일 요약 KPI 카드 */}
      {isLoadingSummary ? (
        <div className="flex justify-center py-8"><Loader2 className="animate-spin w-6 h-6 text-blue-500" /></div>
      ) : summary ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            icon={<AlertTriangle className="w-5 h-5 text-orange-500" />}
            label="총 이벤트 (30일)"
            value={summary.total_events}
            sub="건"
            color="orange"
          />
          <KpiCard
            icon={<TrendingDown className="w-5 h-5 text-red-500" />}
            label="급제동"
            value={summary.by_type['harsh_brake'] ?? 0}
            sub="건"
            color="red"
          />
          <KpiCard
            icon={<Car className="w-5 h-5 text-yellow-500" />}
            label="과속"
            value={summary.by_type['speeding'] ?? 0}
            sub="건"
            color="yellow"
          />
          <KpiCard
            icon={<Shield className="w-5 h-5 text-purple-500" />}
            label="DTC 발생"
            value={summary.dtc_count}
            sub="건"
            color="purple"
          />
        </div>
      ) : null}

      {/* 드라이버 안전 점수 랭킹 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            드라이버 안전 점수 랭킹
            <span className="ml-2 text-sm font-normal text-gray-400">이번 주</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingScores ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin w-6 h-6 text-blue-500" />
            </div>
          ) : !scoresData?.drivers?.length ? (
            <div className="text-center py-12 text-gray-400">
              <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>이번 주 안전 점수 데이터가 없습니다.</p>
              <p className="text-xs mt-1">운행 완료 후 자동으로 계산됩니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {scoresData.drivers.map((driver) => {
                const grade = scoreGrade(driver.total_score);
                return (
                  <div
                    key={driver.driver_id}
                    className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:bg-gray-50"
                  >
                    {/* 순위 */}
                    <div className="w-8 text-center font-bold text-gray-400 text-sm">
                      {driver.rank <= 3 ? ['🥇','🥈','🥉'][driver.rank - 1] : `${driver.rank}위`}
                    </div>

                    {/* 드라이버명 */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{driver.driver_name}</p>
                      <p className="text-xs text-gray-400">
                        운행 {driver.total_trips}회
                      </p>
                    </div>

                    {/* 이벤트 수 */}
                    <div className="hidden md:flex gap-3 text-xs text-gray-500">
                      {driver.harsh_brake_count > 0 && (
                        <span className="text-red-500">급제동 {driver.harsh_brake_count}</span>
                      )}
                      {driver.harsh_accel_count > 0 && (
                        <span className="text-orange-500">급가속 {driver.harsh_accel_count}</span>
                      )}
                      {driver.speeding_count > 0 && (
                        <span className="text-yellow-600">과속 {driver.speeding_count}</span>
                      )}
                    </div>

                    {/* 점수 + 등급 */}
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-900">
                        {driver.total_score.toFixed(0)}점
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${grade.color}`}>
                        {grade.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 이벤트 유형별 현황 */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              이벤트 유형별 현황
              <span className="ml-2 text-sm font-normal text-gray-400">최근 30일</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(summary.by_type).map(([type, count]) => (
                <div key={type} className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                  <p className="text-sm text-gray-500 mt-1">{EVENT_TYPE_KR[type] ?? type}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top 이벤트 드라이버 */}
      {summary?.top_drivers && summary.top_drivers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              이벤트 다발 드라이버 Top 10
              <span className="ml-2 text-sm font-normal text-gray-400">최근 30일</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {summary.top_drivers.map((d, i) => (
                <div key={d.driver_id} className="flex items-center gap-3">
                  <span className="w-6 text-sm text-gray-400 text-right">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-medium text-gray-800">{d.name}</span>
                      <span className="text-sm text-gray-500">{d.event_count}건</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-red-400 h-1.5 rounded-full"
                        style={{ width: `${Math.min((d.event_count / (summary.top_drivers[0]?.event_count || 1)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function KpiCard({
  icon, label, value, sub, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub: string;
  color: string;
}) {
  const bg: Record<string, string> = {
    orange: 'bg-orange-50',
    red:    'bg-red-50',
    yellow: 'bg-yellow-50',
    purple: 'bg-purple-50',
    blue:   'bg-blue-50',
  };
  return (
    <Card className={bg[color] ?? 'bg-gray-50'}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs text-gray-500">{label}</span></div>
        <p className="text-2xl font-bold text-gray-900">
          {value.toLocaleString()}<span className="text-sm font-normal text-gray-400 ml-1">{sub}</span>
        </p>
      </CardContent>
    </Card>
  );
}
