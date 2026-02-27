'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { railsClient } from '@/lib/rails-client';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, UserCheck, UserX, CheckCircle2 } from 'lucide-react';

// ── 타입 정의 ────────────────────────────────────────────────
type CheckInStatus = 'pending' | 'boarded' | 'alighted' | 'absent';

interface CheckInItem {
  id: number;
  passenger_id: number;
  passenger_name: string;
  guardian_name: string | null;
  status: CheckInStatus;
  boarding_order: number | null;
}

// ── 상태 배지 ────────────────────────────────────────────────
function StatusBadge({ status }: { status: CheckInStatus }) {
  const map: Record<CheckInStatus, { label: string; className: string }> = {
    pending:  { label: '대기중',   className: 'bg-gray-100 text-gray-600' },
    boarded:  { label: '탑승중',   className: 'bg-green-100 text-green-700' },
    alighted: { label: '하차완료', className: 'bg-blue-100 text-blue-700' },
    absent:   { label: '결석',     className: 'bg-red-100 text-red-600' },
  };
  const { label, className } = map[status] ?? map.pending;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

// ── 메인 페이지 ───────────────────────────────────────────────
export default function CompanionCheckinPage() {
  const params  = useParams();
  const router  = useRouter();
  const tripId  = params.tripId as string;
  const instId  = params.id as string;

  const [checkIns, setCheckIns]     = useState<CheckInItem[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [loadingId, setLoadingId]   = useState<number | null>(null);
  const [toast, setToast]           = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  // 체크인 목록 로드
  const loadCheckIns = useCallback(async () => {
    try {
      const data = await railsClient.get<CheckInItem[]>(
        `/driver/trips/${tripId}/check_ins`
      );
      // boarding_order 오름차순 정렬
      setCheckIns(
        data.sort((a, b) => (a.boarding_order ?? 9999) - (b.boarding_order ?? 9999))
      );
    } catch (e) {
      showToast('체크인 목록을 불러오지 못했습니다.', false);
    } finally {
      setIsLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    loadCheckIns();
  }, [loadCheckIns]);

  // 탑승 처리
  const handleBoard = async (checkInId: number, passengerName: string) => {
    setLoadingId(checkInId);
    try {
      await railsClient.post(`/driver/check_ins/${checkInId}/board`);
      setCheckIns((prev) =>
        prev.map((c) => (c.id === checkInId ? { ...c, status: 'boarded' } : c))
      );
      showToast(`${passengerName}님 탑승 처리 완료`);
    } catch (e: any) {
      showToast(e?.message || '탑승 처리 실패', false);
    } finally {
      setLoadingId(null);
    }
  };

  // 하차 처리
  const handleAlight = async (checkInId: number, passengerName: string) => {
    setLoadingId(checkInId);
    try {
      await railsClient.post(`/driver/check_ins/${checkInId}/alight`);
      setCheckIns((prev) =>
        prev.map((c) => (c.id === checkInId ? { ...c, status: 'alighted' } : c))
      );
      showToast(`${passengerName}님 하차 처리 완료`);
    } catch (e: any) {
      showToast(e?.message || '하차 처리 실패', false);
    } finally {
      setLoadingId(null);
    }
  };

  const isProcessing = (id: number) => loadingId === id;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push(`/institutions/${instId}/trips`)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">동승자 승하차 처리</h1>
          <p className="text-sm text-muted-foreground">운행 #{tripId}</p>
        </div>
      </div>

      {/* 체크인 목록 */}
      {checkIns.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          등록된 승객이 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {checkIns.map((ci) => (
            <div
              key={ci.id}
              className={`border rounded-xl p-4 flex items-center justify-between gap-4 transition-colors ${
                ci.status === 'alighted'
                  ? 'bg-gray-50 border-gray-200'
                  : ci.status === 'boarded'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-white border-gray-200'
              }`}
            >
              {/* 승객 정보 */}
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate">{ci.passenger_name}</p>
                {ci.guardian_name && (
                  <p className="text-xs text-muted-foreground truncate">보호자: {ci.guardian_name}</p>
                )}
                <div className="mt-1">
                  <StatusBadge status={ci.status} />
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="flex-shrink-0">
                {ci.status === 'pending' && (
                  <button
                    className="inline-flex items-center justify-center gap-1 h-8 rounded-md px-3 text-xs font-medium bg-green-600 hover:bg-green-700 text-white min-w-[72px] disabled:opacity-50 disabled:pointer-events-none"
                    disabled={isProcessing(ci.id)}
                    onClick={() => handleBoard(ci.id, ci.passenger_name)}
                  >
                    {isProcessing(ci.id) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <UserCheck className="h-4 w-4" />
                        탑승
                      </>
                    )}
                  </button>
                )}

                {ci.status === 'boarded' && (
                  <button
                    className="inline-flex items-center justify-center gap-1 h-8 rounded-md px-3 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white min-w-[72px] disabled:opacity-50 disabled:pointer-events-none"
                    disabled={isProcessing(ci.id)}
                    onClick={() => handleAlight(ci.id, ci.passenger_name)}
                  >
                    {isProcessing(ci.id) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <UserX className="h-4 w-4" />
                        하차
                      </>
                    )}
                  </button>
                )}

                {ci.status === 'alighted' && (
                  <div className="flex items-center gap-1 text-blue-600 text-sm font-medium">
                    <CheckCircle2 className="h-4 w-4" />
                    완료
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 통계 요약 */}
      {checkIns.length > 0 && (
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          {[
            { label: '대기', status: 'pending',  className: 'bg-gray-50 border-gray-200' },
            { label: '탑승중', status: 'boarded', className: 'bg-green-50 border-green-200' },
            { label: '하차완료', status: 'alighted', className: 'bg-blue-50 border-blue-200' },
          ].map(({ label, status, className }) => (
            <div key={status} className={`border rounded-lg p-3 ${className}`}>
              <p className="text-2xl font-bold text-gray-900">
                {checkIns.filter((c) => c.status === status).length}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* 토스트 */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg text-white text-sm z-50 transition-all ${
            toast.ok ? 'bg-gray-900' : 'bg-red-600'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
