'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Shield, TrendingUp, TrendingDown, Minus,
  AlertTriangle, CheckCircle, XCircle,
  Loader2, RefreshCw, ChevronDown, Info,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { railsClient } from '@/lib/rails-client';

// ─────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────

interface RiskBreakdownItem {
  raw: number;
  label: string;
  [key: string]: unknown;
}

interface RiskData {
  institution_id: number;
  period: string;
  as_of?: string;
  risk_index: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  discount_rate_pct: number;
  breakdown: {
    safety_score:  RiskBreakdownItem;
    event_rate:    RiskBreakdownItem;
    dtc_severity:  RiskBreakdownItem;
    maintenance:   RiskBreakdownItem;
  };
  meta: {
    total_trips:   number;
    total_events:  number;
    total_dtc:     number;
    period_start:  string;
    period_end:    string;
  };
}

interface TrendPoint {
  period: string;
  risk_index: number;
  risk_level: string;
  discount_rate_pct: number;
}

// ─────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────

const RISK_CONFIG = {
  LOW:      { label: '양호',      color: '#16a34a', bg: 'bg-green-50',  border: 'border-green-200', textColor: 'text-green-700',  icon: CheckCircle },
  MEDIUM:   { label: '보통',      color: '#d97706', bg: 'bg-amber-50',  border: 'border-amber-200', textColor: 'text-amber-700',  icon: Minus },
  HIGH:     { label: '위험',      color: '#dc2626', bg: 'bg-red-50',    border: 'border-red-200',   textColor: 'text-red-700',    icon: AlertTriangle },
  CRITICAL: { label: '매우 위험', color: '#7c3aed', bg: 'bg-purple-50', border: 'border-purple-200', textColor: 'text-purple-700', icon: XCircle },
};

const BREAKDOWN_LABELS: Record<string, { label: string; weight: string }> = {
  safety_score: { label: '안전 점수', weight: '40%' },
  event_rate:   { label: '위험 이벤트 빈도', weight: '30%' },
  dtc_severity: { label: 'DTC 심각도', weight: '20%' },
  maintenance:  { label: '예측 정비 상태', weight: '10%' },
};

// ─────────────────────────────────────────────────
// Gauge Component
// ─────────────────────────────────────────────────

function RiskGauge({ value }: { value: number }) {
  const angle  = -135 + (value / 100) * 270; // -135° ~ +135°
  const color  = value < 30 ? '#16a34a' : value < 50 ? '#d97706' : value < 75 ? '#dc2626' : '#7c3aed';

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 120" className="w-48 h-28">
        {/* 배경 아크 */}
        <path
          d="M 20 110 A 80 80 0 1 1 180 110"
          fill="none" stroke="#e5e7eb" strokeWidth="16" strokeLinecap="round"
        />
        {/* 값 아크 */}
        <path
          d="M 20 110 A 80 80 0 1 1 180 110"
          fill="none" stroke={color} strokeWidth="16" strokeLinecap="round"
          strokeDasharray={`${(value / 100) * 251.3} 251.3`}
        />
        {/* 바늘 */}
        <g transform={`rotate(${angle}, 100, 110)`}>
          <line x1="100" y1="110" x2="100" y2="40" stroke="#374151" strokeWidth="3" strokeLinecap="round" />
          <circle cx="100" cy="110" r="5" fill="#374151" />
        </g>
        {/* 값 텍스트 */}
        <text x="100" y="100" textAnchor="middle" className="text-4xl" style={{ fontSize: '28px', fontWeight: 'bold', fill: color }}>
          {value}
        </text>
        <text x="100" y="118" textAnchor="middle" style={{ fontSize: '11px', fill: '#6b7280' }}>
          / 100
        </text>
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────

export default function RiskReportPage() {
  const { id: institutionId } = useParams() as { id: string };

  const [currentRisk, setCurrentRisk]   = useState<RiskData | null>(null);
  const [trend, setTrend]               = useState<TrendPoint[]>([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const loadAll = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const [riskData, trendData] = await Promise.all([
        railsClient.getRaw<RiskData>('/institutions/risk_reports/current'),
        railsClient.getRaw<{ trend: TrendPoint[] }>('/institutions/risk_reports/trend', { months: 6 }),
      ]);
      setCurrentRisk(riskData);
      setTrend(trendData.trend ?? []);
    } catch (e) {
      console.error('리스크 데이터 로드 실패:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadAll(); }, [institutionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const riskCfg = currentRisk ? RISK_CONFIG[currentRisk.risk_level] ?? RISK_CONFIG.MEDIUM : null;
  const RiskIcon = riskCfg?.icon ?? CheckCircle;

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">보험 리스크 리포트</h1>
        </div>
        <button
          onClick={() => loadAll(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          새로고침
        </button>
      </div>

      {currentRisk && riskCfg && (
        <>
          {/* 상단 2열: 리스크 게이지 + KPI */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 리스크 게이지 */}
            <div className={`bg-white rounded-xl border ${riskCfg.border} p-6 flex flex-col items-center`}>
              <div className="flex items-center gap-2 mb-4 w-full">
                <RiskIcon className={`w-5 h-5 ${riskCfg.textColor}`} />
                <h2 className="text-sm font-semibold text-gray-700">현재 리스크 지수</h2>
                <span className="text-xs text-gray-400 ml-auto">기준일 {currentRisk.as_of}</span>
              </div>

              <RiskGauge value={currentRisk.risk_index} />

              <div className={`mt-4 flex items-center gap-2 px-4 py-2 rounded-full ${riskCfg.bg}`}>
                <span className={`text-sm font-bold ${riskCfg.textColor}`}>
                  {riskCfg.label} ({currentRisk.risk_level})
                </span>
              </div>
            </div>

            {/* KPI 카드들 */}
            <div className="space-y-4">
              {/* 보험료 할인율 */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">보험료 할인율</span>
                  <Info className="w-4 h-4 text-gray-300" />
                </div>
                <p className="text-3xl font-bold text-blue-600">
                  {currentRisk.discount_rate_pct}%
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  리스크 지수 기반 최대 15% 절감
                </p>
              </div>

              {/* 이번 달 요약 */}
              {currentRisk.meta && (
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: '총 운행', value: currentRisk.meta.total_trips, unit: '회' },
                    { label: '이벤트', value: currentRisk.meta.total_events, unit: '건' },
                    { label: 'DTC',    value: currentRisk.meta.total_dtc,    unit: '건' },
                  ].map((item) => (
                    <div key={item.label} className="bg-white rounded-xl border border-gray-200 p-3 text-center">
                      <p className="text-xs text-gray-400">{item.label}</p>
                      <p className="text-xl font-bold text-gray-900 mt-1">{item.value}</p>
                      <p className="text-xs text-gray-400">{item.unit}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 리스크 분해 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="flex items-center justify-between w-full"
            >
              <h2 className="text-sm font-semibold text-gray-700">리스크 구성 요소</h2>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showBreakdown ? 'rotate-180' : ''}`} />
            </button>

            {showBreakdown && (
              <div className="mt-4 space-y-4">
                {Object.entries(currentRisk.breakdown).map(([key, item]) => {
                  const meta = BREAKDOWN_LABELS[key];
                  const pct  = item.raw;
                  const color = pct < 30 ? 'bg-green-500' : pct < 60 ? 'bg-amber-500' : 'bg-red-500';
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-700">{meta?.label ?? key}</span>
                          <span className="text-xs text-gray-400">가중치 {meta?.weight}</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{pct}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                      {item.label && (
                        <p className="text-xs text-gray-400 mt-1">{item.label}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 추이 차트 */}
          {trend.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <h2 className="text-sm font-semibold text-gray-700">최근 6개월 리스크 추이</h2>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(val) => [`${val}`, '리스크 지수']} />
                  <ReferenceLine y={30} stroke="#16a34a" strokeDasharray="3 3" label={{ value: 'LOW', fontSize: 10 }} />
                  <ReferenceLine y={50} stroke="#d97706" strokeDasharray="3 3" label={{ value: 'MEDIUM', fontSize: 10 }} />
                  <ReferenceLine y={75} stroke="#dc2626" strokeDasharray="3 3" label={{ value: 'HIGH', fontSize: 10 }} />
                  <Line
                    type="monotone"
                    dataKey="risk_index"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}
