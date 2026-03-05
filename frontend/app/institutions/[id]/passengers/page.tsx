'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { railsClient } from '@/lib/rails-client';
import {
  Loader2, Plus, Upload, Search, X, QrCode,
  User, Phone, MapPin, Shield, Edit2, Trash2,
} from 'lucide-react';

// ─── 타입 ────────────────────────────────────────────────────
interface Passenger {
  id: number;
  name: string;
  phone: string | null;
  pickup_address: string | null;
  dropoff_address: string | null;
  guardian_phone: string | null;
  is_active: boolean;
  invite_code: string | null;
}

interface PassengerForm {
  name: string;
  phone: string;
  pickup_address: string;
  dropoff_address: string;
  guardian_phone: string;
}

const EMPTY_FORM: PassengerForm = {
  name: '',
  phone: '',
  pickup_address: '',
  dropoff_address: '',
  guardian_phone: '',
};

// ─── 메인 페이지 ─────────────────────────────────────────────
export default function PassengersPage() {
  const params = useParams();
  const institutionId = params.id as string;
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Passenger | null>(null);
  const [form, setForm] = useState<PassengerForm>(EMPTY_FORM);
  const [qrDownloading, setQrDownloading] = useState<number | null>(null);

  // ── 목록 조회 ──
  const { data: passengers = [], isLoading } = useQuery<Passenger[]>({
    queryKey: ['passengers', institutionId, search],
    queryFn: () =>
      railsClient.get<Passenger[]>('/institutions/passengers', search ? { q: search } : undefined),
  });

  // ── 등록 ──
  const createMutation = useMutation({
    mutationFn: (data: PassengerForm) =>
      railsClient.post('/institutions/passengers', { passenger: data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['passengers', institutionId] });
      closeForm();
    },
  });

  // ── 수정 ──
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: PassengerForm }) =>
      railsClient.patch(`/institutions/passengers/${id}`, { passenger: data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['passengers', institutionId] });
      closeForm();
    },
  });

  // ── 비활성화(삭제) ──
  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      railsClient.delete(`/institutions/passengers/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['passengers', institutionId] });
    },
  });

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (p: Passenger) => {
    setEditTarget(p);
    setForm({
      name: p.name ?? '',
      phone: p.phone ?? '',
      pickup_address: p.pickup_address ?? '',
      dropoff_address: p.dropoff_address ?? '',
      guardian_phone: p.guardian_phone ?? '',
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditTarget(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    if (editTarget) {
      updateMutation.mutate({ id: editTarget.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleQrDownload = async (p: Passenger) => {
    setQrDownloading(p.id);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const token = localStorage.getItem('rails_access_token');
      const res = await fetch(`${apiBase}/institutions/passengers/${p.id}/qr_code`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr_${p.name}_${new Date().toISOString().slice(0, 10)}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert('QR 코드 다운로드에 실패했습니다.');
    } finally {
      setQrDownloading(null);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* ─── 헤더 ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#16325C]">승객 관리</h1>
          <p className="text-sm text-gray-500 mt-0.5">{passengers.length}명 등록됨</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 text-sm bg-[#00A1E0] text-white px-4 py-2 rounded-lg hover:bg-[#0081B3] transition-colors"
        >
          <Plus className="w-4 h-4" strokeWidth={2} />
          새 승객 등록
        </button>
      </div>

      {/* ─── 등록/수정 폼 ─── */}
      {showForm && (
        <div className="bg-white rounded-xl border border-[#00A1E0]/40 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-[#16325C]">
              {editTarget ? '승객 정보 수정' : '새 승객 등록'}
            </p>
            <button onClick={closeForm} className="p-1 text-gray-400 hover:text-gray-600 rounded">
              <X className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>

          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="이름 *" icon={<User className="w-3.5 h-3.5" />}>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="홍길동"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00A1E0]/30"
              />
            </FormField>

            <FormField label="연락처" icon={<Phone className="w-3.5 h-3.5" />}>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="010-0000-0000"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00A1E0]/30"
              />
            </FormField>

            <FormField label="픽업 주소" icon={<MapPin className="w-3.5 h-3.5" />}>
              <input
                type="text"
                value={form.pickup_address}
                onChange={e => setForm(f => ({ ...f, pickup_address: e.target.value }))}
                placeholder="서울시 마포구 ..."
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00A1E0]/30"
              />
            </FormField>

            <FormField label="하차 주소" icon={<MapPin className="w-3.5 h-3.5" />}>
              <input
                type="text"
                value={form.dropoff_address}
                onChange={e => setForm(f => ({ ...f, dropoff_address: e.target.value }))}
                placeholder="서울시 강남구 ..."
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00A1E0]/30"
              />
            </FormField>

            <FormField label="보호자 연락처" icon={<Shield className="w-3.5 h-3.5" />} className="sm:col-span-2">
              <input
                type="tel"
                value={form.guardian_phone}
                onChange={e => setForm(f => ({ ...f, guardian_phone: e.target.value }))}
                placeholder="010-0000-0000"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#00A1E0]/30"
              />
            </FormField>
          </div>

          <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
            <button
              onClick={closeForm}
              className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={isPending || !form.name.trim()}
              className="flex items-center gap-1.5 text-sm bg-[#00A1E0] text-white px-4 py-2 rounded-lg hover:bg-[#0081B3] disabled:opacity-50 transition-colors"
            >
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {editTarget ? '저장' : '등록'}
            </button>
          </div>

          {/* 에러 표시 */}
          {(createMutation.error || updateMutation.error) && (
            <p className="px-5 pb-3 text-xs text-red-500">
              {(createMutation.error as any)?.message || (updateMutation.error as any)?.message || '저장에 실패했습니다.'}
            </p>
          )}
        </div>
      )}

      {/* ─── 검색 ─── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" strokeWidth={2} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="이름으로 검색"
          className="w-full text-sm border border-gray-200 rounded-lg pl-9 pr-9 py-2 focus:outline-none focus:ring-2 focus:ring-[#00A1E0]/30"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        )}
      </div>

      {/* ─── 목록 ─── */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-[#00A1E0]" />
        </div>
      ) : passengers.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          {search ? '검색 결과가 없습니다.' : '등록된 승객이 없습니다. 새 승객을 등록해주세요.'}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
          {passengers.map(p => (
            <div key={p.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50">
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#16325C]">{p.name}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5">
                  {p.phone && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Phone className="w-3 h-3" strokeWidth={2} />
                      {p.phone}
                    </span>
                  )}
                  {p.pickup_address && (
                    <span className="text-xs text-gray-400 flex items-center gap-1 truncate max-w-xs">
                      <MapPin className="w-3 h-3 shrink-0" strokeWidth={2} />
                      {p.pickup_address}
                    </span>
                  )}
                  {p.guardian_phone && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Shield className="w-3 h-3" strokeWidth={2} />
                      {p.guardian_phone}
                    </span>
                  )}
                  {p.invite_code && (
                    <span className="text-xs text-gray-300">초대코드: {p.invite_code}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 ml-4 flex-shrink-0">
                {/* QR 다운로드 */}
                <button
                  onClick={() => handleQrDownload(p)}
                  disabled={qrDownloading === p.id}
                  title="QR 코드 다운로드"
                  className="p-1.5 text-gray-400 hover:text-[#00A1E0] hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                >
                  {qrDownloading === p.id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <QrCode className="w-4 h-4" strokeWidth={2} />}
                </button>

                {/* 수정 */}
                <button
                  onClick={() => openEdit(p)}
                  title="수정"
                  className="p-1.5 text-gray-400 hover:text-[#00A1E0] hover:bg-blue-50 rounded transition-colors"
                >
                  <Edit2 className="w-4 h-4" strokeWidth={2} />
                </button>

                {/* 비활성화(삭제) */}
                <button
                  onClick={() => {
                    if (confirm(`${p.name} 승객을 비활성화하시겠습니까?`)) {
                      deleteMutation.mutate(p.id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                  title="비활성화"
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" strokeWidth={2} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 폼 필드 래퍼 ────────────────────────────────────────────
function FormField({
  label, icon, children, className = '',
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="text-xs text-gray-500 mb-1 flex items-center gap-1">
        {icon}
        {label}
      </label>
      {children}
    </div>
  );
}
