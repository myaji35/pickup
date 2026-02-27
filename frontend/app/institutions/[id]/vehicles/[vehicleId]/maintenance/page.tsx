'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Wrench, CheckCircle, AlertTriangle, XCircle,
  RefreshCw, Loader2, Plus, Trash2, ChevronDown, ChevronUp,
  Gauge, Calendar, Activity,
} from 'lucide-react';
import { railsClient } from '@/lib/rails-client';

// ─────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────

interface MaintenancePrediction {
  id: number;
  component: string;
  status: 'ok' | 'warning' | 'overdue';
  remaining_km: number | null;
  remaining_days: number | null;
  predicted_due_date: string | null;
  confidence_pct: number | null;
  basis: string | null;
  last_predicted_at: string;
}

interface MaintenanceRecord {
  id: number;
  component: string;
  record_type: string;
  performed_on: string;
  mileage_km: number | null;
  cost: number | null;
  garage_name: string | null;
  notes: string | null;
  created_by_role: string | null;
  created_at: string;
}

interface PredictionsResponse {
  vehicle_id: number;
  plate_number: string;
  current_mileage_km: number;
  predictions: MaintenancePrediction[];
}

// ─────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────

const COMPONENT_LABELS: Record<string, string> = {
  brake_pads: '브레이크 패드',
  engine_oil: '엔진 오일',
  tires:      '타이어',
  air_filter: '에어 필터',
  battery:    '배터리',
};

const COMPONENT_ICONS: Record<string, string> = {
  brake_pads: '🛑',
  engine_oil: '🔧',
  tires:      '🛞',
  air_filter: '💨',
  battery:    '🔋',
};

const RECORD_TYPE_LABELS: Record<string, string> = {
  repair:      '수리',
  inspection:  '점검',
  replacement: '교체',
};

const STATUS_CONFIG = {
  ok:      { label: '정상',      color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200', icon: CheckCircle },
  warning: { label: '주의',      color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-200', icon: AlertTriangle },
  overdue: { label: '교체 필요', color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200',   icon: XCircle },
};

// ─────────────────────────────────────────────────
// Record Form
// ─────────────────────────────────────────────────

interface RecordFormProps {
  vehicleId: string;
  institutionId: string;
  onCreated: () => void;
  onCancel: () => void;
}

function RecordForm({ vehicleId, institutionId, onCreated, onCancel }: RecordFormProps) {
  const [form, setForm] = useState({
    component:    'engine_oil',
    record_type:  'replacement',
    performed_on: new Date().toISOString().slice(0, 10),
    mileage_km:   '',
    cost:         '',
    garage_name:  '',
    notes:        '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await railsClient.post(
        `/institutions/vehicles/${vehicleId}/maintenance/records`,
        { maintenance_record: form }
      );
      onCreated();
    } catch (e: any) {
      setError(e?.message ?? '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-4">
      <h3 className="text-sm font-semibold text-blue-900">정비 기록 등록</h3>
      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">부품</label>
          <select
            value={form.component}
            onChange={(e) => setForm({ ...form, component: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          >
            {Object.entries(COMPONENT_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">유형</label>
          <select
            value={form.record_type}
            onChange={(e) => setForm({ ...form, record_type: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          >
            {Object.entries(RECORD_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">정비일</label>
          <input
            type="date"
            value={form.performed_on}
            onChange={(e) => setForm({ ...form, performed_on: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">주행거리 (km)</label>
          <input
            type="number"
            value={form.mileage_km}
            onChange={(e) => setForm({ ...form, mileage_km: e.target.value })}
            placeholder="예: 45000"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">비용 (원)</label>
          <input
            type="number"
            value={form.cost}
            onChange={(e) => setForm({ ...form, cost: e.target.value })}
            placeholder="예: 150000"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">정비소</label>
          <input
            type="text"
            value={form.garage_name}
            onChange={(e) => setForm({ ...form, garage_name: e.target.value })}
            placeholder="예: 스피드메이트"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">메모</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={2}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
        />
      </div>

      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
          취소
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          저장
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────

export default function MaintenancePage() {
  const { id: institutionId, vehicleId } = useParams() as { id: string; vehicleId: string };

  const [predData, setPredData]     = useState<PredictionsResponse | null>(null);
  const [records, setRecords]       = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm]     = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const loadAll = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const [preds, recs] = await Promise.all([
        railsClient.get<PredictionsResponse>(
          `/institutions/vehicles/${vehicleId}/maintenance/predictions`
        ),
        railsClient.get<MaintenanceRecord[]>(
          `/institutions/vehicles/${vehicleId}/maintenance/records`
        ),
      ]);
      setPredData(preds);
      setRecords(recs);
    } catch (e) {
      console.error('정비 데이터 로드 실패:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefreshPredictions = async () => {
    setRefreshing(true);
    try {
      const result = await railsClient.post<PredictionsResponse>(
        `/institutions/vehicles/${vehicleId}/maintenance/predictions/refresh`,
        {}
      );
      setPredData((prev) => prev ? { ...prev, predictions: result.predictions } : prev);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeleteRecord = async (id: number) => {
    if (!confirm('정비 기록을 삭제하시겠습니까?')) return;
    await railsClient.delete(`/institutions/vehicles/${vehicleId}/maintenance/records/${id}`);
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  useEffect(() => { loadAll(); }, [vehicleId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const needsAttention = predData?.predictions.filter((p) => p.status !== 'ok') ?? [];

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">AI 예측 정비</h1>
          </div>
          {predData && (
            <p className="text-sm text-gray-500 mt-1">
              차량 {predData.plate_number} · 현재 주행거리 {predData.current_mileage_km.toLocaleString()} km
            </p>
          )}
        </div>
        <button
          onClick={handleRefreshPredictions}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          예측 갱신
        </button>
      </div>

      {/* 주의 알림 배너 */}
      {needsAttention.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              {needsAttention.length}개 부품 점검이 필요합니다
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              {needsAttention.map((p) => COMPONENT_LABELS[p.component] ?? p.component).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* 예측 카드 그리드 */}
      {predData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {predData.predictions.map((pred) => {
            const cfg   = STATUS_CONFIG[pred.status];
            const Icon  = cfg.icon;
            const label = COMPONENT_LABELS[pred.component] ?? pred.component;
            const emoji = COMPONENT_ICONS[pred.component] ?? '🔩';
            const expanded = expandedId === pred.id;

            return (
              <div
                key={pred.id}
                className={`bg-white rounded-xl border ${cfg.border} overflow-hidden`}
              >
                {/* 카드 헤더 */}
                <div className={`${cfg.bg} px-4 pt-4 pb-3`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg">{emoji}</span>
                    <span className={`flex items-center gap-1 text-xs font-semibold ${cfg.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-gray-900">{label}</p>
                </div>

                {/* 카드 바디 */}
                <div className="px-4 py-3 space-y-2">
                  {pred.remaining_km !== null && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Gauge className="w-4 h-4 text-gray-400" />
                      잔여 <span className="font-semibold text-gray-900">{pred.remaining_km.toLocaleString()} km</span>
                    </div>
                  )}
                  {pred.remaining_days !== null && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      잔여 <span className="font-semibold text-gray-900">{pred.remaining_days}일</span>
                      {pred.predicted_due_date && (
                        <span className="text-xs text-gray-400">
                          ({pred.predicted_due_date.slice(0, 10)} 예정)
                        </span>
                      )}
                    </div>
                  )}
                  {pred.confidence_pct !== null && (
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-gray-400" />
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${pred.confidence_pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400">{pred.confidence_pct}%</span>
                    </div>
                  )}

                  {/* 예측 근거 토글 */}
                  {pred.basis && (
                    <button
                      onClick={() => setExpandedId(expanded ? null : pred.id)}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 pt-1"
                    >
                      {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      예측 근거
                    </button>
                  )}
                  {expanded && pred.basis && (
                    <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2 leading-relaxed">
                      {pred.basis}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 정비 기록 섹션 */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">정비 이력</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            기록 추가
          </button>
        </div>

        {showForm && (
          <div className="p-5 border-b border-gray-100">
            <RecordForm
              vehicleId={vehicleId}
              institutionId={institutionId}
              onCreated={() => { setShowForm(false); loadAll(true); }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        {records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
            <Wrench className="w-10 h-10" />
            <p className="text-sm">정비 이력이 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">부품</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">유형</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">정비일</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">주행거리</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">비용</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">정비소</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-800">
                      {COMPONENT_ICONS[rec.component] ?? '🔩'} {COMPONENT_LABELS[rec.component] ?? rec.component}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {RECORD_TYPE_LABELS[rec.record_type] ?? rec.record_type}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{rec.performed_on}</td>
                    <td className="px-5 py-3 text-gray-600">
                      {rec.mileage_km ? `${rec.mileage_km.toLocaleString()} km` : '-'}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {rec.cost ? `₩${Number(rec.cost).toLocaleString()}` : '-'}
                    </td>
                    <td className="px-5 py-3 text-gray-500">{rec.garage_name ?? '-'}</td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => handleDeleteRecord(rec.id)}
                        className="text-gray-300 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
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
