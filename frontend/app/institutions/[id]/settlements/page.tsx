'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { railsClient } from '@/lib/rails-client';
import {
  Receipt,
  Car,
  Plus,
  Fuel,
  Wrench,
  Navigation,
  CheckCircle,
  Clock,
  Trash2,
  Upload,
  TrendingDown,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ExpenseReceipt {
  id: number;
  vehicle_id: number;
  receipt_type: string;
  type_label: string;
  image_url: string | null;
  amount_krw: number | null;
  vendor_name: string | null;
  receipt_date: string;
  ocr_status: string;
  confirmed: boolean;
  created_at: string;
}

interface Settlement {
  id: number;
  vehicle_id: number;
  year: number;
  month: number;
  period_label: string;
  total_trips: number;
  total_distance_km: number;
  fuel_cost_krw: number;
  maintenance_cost_krw: number;
  toll_cost_krw: number;
  total_cost_krw: number;
  status: string;
}

interface Vehicle {
  id: number;
  plate_number: string;
  plate_last4: string;
}

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  fuel: Fuel,
  maintenance: Wrench,
  toll: Navigation,
  other: Receipt,
};

const TYPE_COLORS: Record<string, string> = {
  fuel: 'bg-orange-100 text-orange-700',
  maintenance: 'bg-blue-100 text-blue-700',
  toll: 'bg-green-100 text-green-700',
  other: 'bg-gray-100 text-gray-700',
};

const OCR_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  done: { label: 'OCR 완료', color: 'text-green-600' },
  pending: { label: 'OCR 처리중', color: 'text-yellow-600' },
  failed: { label: 'OCR 실패', color: 'text-red-500' },
};

function formatKRW(n: number | null) {
  if (n === null || n === undefined) return '-';
  return n.toLocaleString('ko-KR') + '원';
}

export default function SettlementsPage() {
  const params = useParams();
  const institutionId = params.id as string;
  const queryClient = useQueryClient();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [filterVehicleId, setFilterVehicleId] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedVehicle, setExpandedVehicle] = useState<number | null>(null);

  // New receipt form
  const [newReceipt, setNewReceipt] = useState({
    vehicle_id: '',
    receipt_type: 'fuel',
    amount_krw: '',
    vendor_name: '',
    receipt_date: now.toISOString().slice(0, 10),
  });

  // Fetch vehicles
  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles', institutionId],
    queryFn: () => railsClient.get<{ success: boolean; data: Vehicle[] }>('/institutions/vehicles'),
  });
  const vehicles: Vehicle[] = vehiclesData?.data ?? [];

  // Fetch receipts
  const { data: receiptsData, isLoading: receiptsLoading } = useQuery({
    queryKey: ['receipts', institutionId, year, month, filterVehicleId, filterType],
    queryFn: () => {
      const p: Record<string, string | number> = { month: `${year}-${String(month).padStart(2, '0')}` };
      if (filterVehicleId) p.vehicle_id = filterVehicleId;
      if (filterType) p.receipt_type = filterType;
      return railsClient.get<{ success: boolean; data: ExpenseReceipt[] }>('/institutions/expense_receipts', p);
    },
  });
  const receipts: ExpenseReceipt[] = receiptsData?.data ?? [];

  // Fetch settlements
  const { data: settlementsData, isLoading: settlementsLoading } = useQuery({
    queryKey: ['settlements', institutionId, year, month],
    queryFn: () => railsClient.get<{ success: boolean; data: Settlement[] }>('/institutions/settlements', { year, month }),
  });
  const settlements: Settlement[] = settlementsData?.data ?? [];

  // Confirm receipt
  const confirmMutation = useMutation({
    mutationFn: (id: number) => railsClient.patch(`/institutions/expense_receipts/${id}/confirm`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['receipts', institutionId] }),
  });

  // Delete receipt
  const deleteMutation = useMutation({
    mutationFn: (id: number) => railsClient.delete(`/institutions/expense_receipts/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['receipts', institutionId] }),
  });

  // Create receipt
  const createMutation = useMutation({
    mutationFn: (body: Record<string, string>) =>
      railsClient.post('/institutions/expense_receipts', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts', institutionId] });
      queryClient.invalidateQueries({ queryKey: ['settlements', institutionId] });
      setShowAddForm(false);
      setNewReceipt({
        vehicle_id: '',
        receipt_type: 'fuel',
        amount_krw: '',
        vendor_name: '',
        receipt_date: now.toISOString().slice(0, 10),
      });
    },
  });

  const totalCost = settlements.reduce((sum, s) => sum + s.total_cost_krw, 0);
  const confirmedReceipts = receipts.filter((r) => r.confirmed).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">정산 관리</h1>
          <p className="text-sm text-slate-500 mt-1">월별 차량 비용 영수증 및 정산 현황</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          영수증 등록
        </button>
      </div>

      {/* Period Selector */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-600">연도</label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[now.getFullYear(), now.getFullYear() - 1].map((y) => (
              <option key={y} value={y}>{y}년</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-600">월</label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{m}월</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-600">차량</label>
          <select
            value={filterVehicleId}
            onChange={(e) => setFilterVehicleId(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">전체</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.plate_number}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-600">유형</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">전체</option>
            <option value="fuel">연료</option>
            <option value="maintenance">정비</option>
            <option value="toll">통행료</option>
            <option value="other">기타</option>
          </select>
        </div>
      </div>

      {/* Add Receipt Form */}
      {showAddForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-blue-900">영수증 등록</h3>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">차량 *</label>
              <select
                value={newReceipt.vehicle_id}
                onChange={(e) => setNewReceipt({ ...newReceipt, vehicle_id: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">차량 선택</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>{v.plate_number}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">영수증 유형 *</label>
              <select
                value={newReceipt.receipt_type}
                onChange={(e) => setNewReceipt({ ...newReceipt, receipt_type: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="fuel">연료</option>
                <option value="maintenance">정비</option>
                <option value="toll">통행료</option>
                <option value="other">기타</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">금액 (원)</label>
              <input
                type="number"
                value={newReceipt.amount_krw}
                onChange={(e) => setNewReceipt({ ...newReceipt, amount_krw: e.target.value })}
                placeholder="50000"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">업체명</label>
              <input
                type="text"
                value={newReceipt.vendor_name}
                onChange={(e) => setNewReceipt({ ...newReceipt, vendor_name: e.target.value })}
                placeholder="홍길동주유소"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">날짜 *</label>
              <input
                type="date"
                value={newReceipt.receipt_date}
                onChange={(e) => setNewReceipt({ ...newReceipt, receipt_date: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (!newReceipt.vehicle_id || !newReceipt.receipt_date) return;
                createMutation.mutate({
                  vehicle_id: newReceipt.vehicle_id,
                  receipt_type: newReceipt.receipt_type,
                  amount_krw: newReceipt.amount_krw,
                  vendor_name: newReceipt.vendor_name,
                  receipt_date: newReceipt.receipt_date,
                });
              }}
              disabled={createMutation.isPending || !newReceipt.vehicle_id}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {createMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              등록
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-sm text-slate-500 mb-1">총 비용</div>
          <div className="text-xl font-bold text-slate-900">{formatKRW(totalCost)}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-sm text-slate-500 mb-1">영수증</div>
          <div className="text-xl font-bold text-slate-900">
            {receipts.length}건
            <span className="text-sm font-normal text-green-600 ml-2">확정 {confirmedReceipts}</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-sm text-slate-500 mb-1">연료비</div>
          <div className="text-xl font-bold text-orange-600">
            {formatKRW(settlements.reduce((s, x) => s + x.fuel_cost_krw, 0))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-sm text-slate-500 mb-1">정비비</div>
          <div className="text-xl font-bold text-blue-600">
            {formatKRW(settlements.reduce((s, x) => s + x.maintenance_cost_krw, 0))}
          </div>
        </div>
      </div>

      {/* Settlements by Vehicle */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-slate-400" />
            차량별 월간 정산
          </h2>
        </div>
        {settlementsLoading ? (
          <div className="flex items-center justify-center h-24 text-slate-400">
            <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : settlements.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-slate-400 text-sm">
            정산 데이터가 없습니다.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {settlements.map((s) => {
              const vehicle = vehicles.find((v) => v.id === s.vehicle_id);
              const isExpanded = expandedVehicle === s.vehicle_id;
              const vehicleReceipts = receipts.filter((r) => r.vehicle_id === s.vehicle_id);
              return (
                <div key={s.id}>
                  <button
                    className="w-full flex items-center px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                    onClick={() => setExpandedVehicle(isExpanded ? null : s.vehicle_id)}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <Car className="w-4 h-4 text-slate-400" />
                      <span className="font-medium text-slate-800">
                        {vehicle?.plate_number ?? `차량 #${s.vehicle_id}`}
                      </span>
                      <span className="text-xs text-slate-400">{s.period_label}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-6 text-right mr-4">
                      <div>
                        <div className="text-xs text-slate-400">운행</div>
                        <div className="text-sm font-medium">{s.total_trips}회</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400">연료비</div>
                        <div className="text-sm font-medium text-orange-600">{formatKRW(s.fuel_cost_krw)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400">정비비</div>
                        <div className="text-sm font-medium text-blue-600">{formatKRW(s.maintenance_cost_krw)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400">합계</div>
                        <div className="text-sm font-bold text-slate-900">{formatKRW(s.total_cost_krw)}</div>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {/* Expanded receipts */}
                  {isExpanded && (
                    <div className="bg-slate-50 px-4 pb-3">
                      {vehicleReceipts.length === 0 ? (
                        <p className="text-sm text-slate-400 py-2">이 차량의 영수증이 없습니다.</p>
                      ) : (
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-xs text-slate-500">
                              <th className="text-left py-2">유형</th>
                              <th className="text-left py-2">날짜</th>
                              <th className="text-left py-2">업체명</th>
                              <th className="text-right py-2">금액</th>
                              <th className="text-center py-2">OCR</th>
                              <th className="text-center py-2">확정</th>
                              <th className="w-16" />
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {vehicleReceipts.map((r) => {
                              const Icon = TYPE_ICONS[r.receipt_type] ?? Receipt;
                              const ocrInfo = OCR_STATUS_LABELS[r.ocr_status];
                              return (
                                <tr key={r.id} className="hover:bg-white transition-colors">
                                  <td className="py-2">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[r.receipt_type] ?? 'bg-gray-100 text-gray-700'}`}>
                                      <Icon className="w-3 h-3" />
                                      {r.type_label}
                                    </span>
                                  </td>
                                  <td className="py-2 text-slate-600">{r.receipt_date}</td>
                                  <td className="py-2 text-slate-600">{r.vendor_name ?? '-'}</td>
                                  <td className="py-2 text-right font-medium text-slate-800">
                                    {formatKRW(r.amount_krw)}
                                  </td>
                                  <td className="py-2 text-center">
                                    <span className={`text-xs font-medium ${ocrInfo?.color ?? 'text-slate-400'}`}>
                                      {ocrInfo?.label ?? r.ocr_status}
                                    </span>
                                  </td>
                                  <td className="py-2 text-center">
                                    {r.confirmed ? (
                                      <CheckCircle className="w-4 h-4 text-green-500 inline" />
                                    ) : (
                                      <button
                                        onClick={() => confirmMutation.mutate(r.id)}
                                        disabled={confirmMutation.isPending}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                                      >
                                        <Clock className="w-3 h-3" />
                                        확정
                                      </button>
                                    )}
                                  </td>
                                  <td className="py-2 text-center">
                                    {!r.confirmed && (
                                      <button
                                        onClick={() => deleteMutation.mutate(r.id)}
                                        disabled={deleteMutation.isPending}
                                        className="p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* All Receipts Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-slate-400" />
            영수증 목록
          </h2>
          <span className="text-sm text-slate-500">{receipts.length}건</span>
        </div>
        {receiptsLoading ? (
          <div className="flex items-center justify-center h-24">
            <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : receipts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 text-slate-400 gap-1">
            <p className="text-sm">등록된 영수증이 없습니다.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">유형</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">차량</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">날짜</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">업체</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">금액</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">OCR</th>
                <th className="text-center px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase">확정</th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {receipts.map((r) => {
                const Icon = TYPE_ICONS[r.receipt_type] ?? Receipt;
                const vehicle = vehicles.find((v) => v.id === r.vehicle_id);
                const ocrInfo = OCR_STATUS_LABELS[r.ocr_status];
                return (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[r.receipt_type] ?? 'bg-gray-100 text-gray-700'}`}>
                        <Icon className="w-3 h-3" />
                        {r.type_label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {vehicle?.plate_number ?? `#${r.vehicle_id}`}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{r.receipt_date}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{r.vendor_name ?? '-'}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-800 text-right">
                      {formatKRW(r.amount_krw)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-medium ${ocrInfo?.color ?? 'text-slate-400'}`}>
                        {ocrInfo?.label ?? r.ocr_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {r.confirmed ? (
                        <CheckCircle className="w-4 h-4 text-green-500 inline" />
                      ) : (
                        <button
                          onClick={() => confirmMutation.mutate(r.id)}
                          disabled={confirmMutation.isPending}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                        >
                          <Clock className="w-3 h-3" />
                          확정
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {!r.confirmed && (
                        <button
                          onClick={() => deleteMutation.mutate(r.id)}
                          disabled={deleteMutation.isPending}
                          className="p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
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
