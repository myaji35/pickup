'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useDtcReports, useAcknowledgeDtc } from '@/hooks/queries/use-safety';
import { useNearbyGarages, useCreateGarageReservation, PartnerGarage } from '@/hooks/queries/use-garages';
import { DtcReport } from '@/types/safety';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ChevronLeft, CheckCircle, Wrench, MapPin, Phone, Star, X } from 'lucide-react';
import Link from 'next/link';

const STATUS_LABEL: Record<string, string> = {
  pending:      '미확인',
  acknowledged: '확인됨',
  resolved:     '해결됨',
};

const STATUS_COLOR: Record<string, string> = {
  pending:      'bg-red-100 text-red-700',
  acknowledged: 'bg-yellow-100 text-yellow-700',
  resolved:     'bg-green-100 text-green-700',
};

/**
 * DTC 이력 페이지 — Epic 7 Phase B
 * OBD-II 차량 고장코드 이력 + 확인 처리
 */
export default function DtcHistoryPage() {
  const params = useParams();
  const institutionId = params.id as string;

  const [statusFilter, setStatusFilter] = useState('');
  const [codeFilter,   setCodeFilter]   = useState('');

  // 정비소 예약 다이얼로그 상태
  const [garageDialogOpen, setGarageDialogOpen] = useState(false);
  const [selectedGarage, setSelectedGarage]     = useState<PartnerGarage | null>(null);
  const [reserveDate,    setReserveDate]         = useState('');
  const [reserveTime,    setReserveTime]         = useState('');
  const [reserveNote,    setReserveNote]         = useState('');
  const [reserveVehicle, setReserveVehicle]      = useState('');

  const { data: reports, isLoading } = useDtcReports({
    status: statusFilter || undefined,
    code:   codeFilter.trim() || undefined,
    limit: 100,
  });

  const acknowledge    = useAcknowledgeDtc();
  // 기관 위치 기반 정비소 조회 (기본 서울 중심 좌표 — 실제 기관 주소로 대체 가능)
  const { data: garages = [] } = useNearbyGarages(37.5665, 126.9780);
  const createReservation      = useCreateGarageReservation();

  const handleAcknowledge = (id: number) => {
    acknowledge.mutate(id);
  };

  const handleOpenGarageDialog = (garage: PartnerGarage) => {
    setSelectedGarage(garage);
    setReserveDate(new Date(Date.now() + 86400000).toISOString().slice(0, 10));
    setGarageDialogOpen(true);
  };

  const handleCreateReservation = () => {
    if (!selectedGarage || !reserveDate || !reserveVehicle) {
      alert('차량과 예약 날짜를 선택해 주세요.');
      return;
    }
    createReservation.mutate({
      garage_id:     selectedGarage.id,
      vehicle_id:    reserveVehicle,
      reserved_date: reserveDate,
      reserved_time: reserveTime || undefined,
      note:          reserveNote || undefined,
    }, {
      onSuccess: () => {
        alert('예약이 완료되었습니다.');
        setGarageDialogOpen(false);
        setReserveNote(''); setReserveTime(''); setReserveVehicle('');
      },
      onError: () => alert('예약에 실패했습니다.'),
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Link
          href={`/institutions/${institutionId}/safety`}
          className="text-gray-400 hover:text-gray-600"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">DTC 이력</h1>
          <p className="text-sm text-gray-400">OBD-II 차량 고장 코드 수신 이력 및 확인 처리</p>
        </div>
      </div>

      {/* 필터 */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3">
            <select
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">전체 상태</option>
              {Object.entries(STATUS_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>

            <input
              type="text"
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 w-32"
              placeholder="코드 (예: P0301)"
              value={codeFilter}
              onChange={(e) => setCodeFilter(e.target.value.toUpperCase())}
              maxLength={6}
            />

            <button
              onClick={() => { setStatusFilter(''); setCodeFilter(''); }}
              className="text-sm text-gray-400 hover:text-gray-600 px-2"
            >
              초기화
            </button>
          </div>
        </CardContent>
      </Card>

      {/* DTC 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            DTC 목록
            {reports && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                총 {reports.length}건
                {reports.filter(r => r.status === 'pending').length > 0 && (
                  <span className="ml-2 text-red-500 font-medium">
                    미확인 {reports.filter(r => r.status === 'pending').length}건
                  </span>
                )}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin w-6 h-6 text-blue-500" />
            </div>
          ) : !reports?.length ? (
            <div className="text-center py-12 text-gray-400">
              <p>DTC 이력이 없습니다.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">수신 시각</th>
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">코드</th>
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">차량</th>
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">운행 ID</th>
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">상태</th>
                    <th className="text-right py-2 px-3 text-gray-500 font-medium">처리</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr
                      key={report.id}
                      className={`border-b border-gray-50 hover:bg-gray-50 ${
                        report.status === 'pending' ? 'bg-red-50/30' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 text-gray-600">
                        {new Date(report.reported_at).toLocaleString('ko-KR', {
                          month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-xs">
                          {report.code}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-gray-700">
                        {report.vehicle.plate_number}
                      </td>
                      <td className="py-2.5 px-3 text-gray-400">
                        #{report.trip_id}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[report.status]}`}>
                          {STATUS_LABEL[report.status]}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {report.status === 'pending' && (
                          <button
                            onClick={() => handleAcknowledge(report.id)}
                            disabled={acknowledge.isPending}
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 disabled:opacity-40"
                          >
                            {acknowledge.isPending
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <CheckCircle className="w-3 h-3" />
                            }
                            확인
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 근처 제휴 정비소 추천 — Epic 13 */}
      {garages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Wrench className="w-4 h-4 text-orange-500" />
              근처 제휴 정비소
              <span className="text-sm font-normal text-gray-400">반경 3km</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {garages.map((garage) => (
                <div
                  key={garage.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 hover:bg-orange-50/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{garage.name}</p>
                      {garage.brand && (
                        <p className="text-xs text-orange-600 font-medium">{garage.brand}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-amber-500">
                      <Star className="w-3 h-3 fill-current" />
                      {garage.rating.toFixed(1)}
                    </div>
                  </div>
                  <div className="space-y-1 text-xs text-gray-500 mb-3">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{garage.address}</span>
                    </div>
                    {garage.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 flex-shrink-0" />
                        {garage.phone}
                      </div>
                    )}
                    {garage.distance_km !== undefined && (
                      <p className="text-blue-600 font-medium">{garage.distance_km.toFixed(1)}km</p>
                    )}
                    {garage.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {garage.specialties.slice(0, 3).map((s) => (
                          <span key={s} className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleOpenGarageDialog(garage)}
                    className="w-full text-xs bg-orange-500 hover:bg-orange-600 text-white py-1.5 rounded-lg font-medium transition-colors"
                  >
                    예약하기
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* DTC 코드 안내 */}
      <Card className="bg-blue-50 border-blue-100">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm font-semibold text-blue-800 mb-2">OBD-II DTC 코드 안내</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-blue-700">
            <div><strong>P</strong> — 파워트레인 (엔진, 변속기)</div>
            <div><strong>C</strong> — 섀시 (브레이크, 조향)</div>
            <div><strong>B</strong> — 바디 (에어백, 창문)</div>
            <div><strong>U</strong> — 통신 네트워크</div>
          </div>
        </CardContent>
      </Card>

      {/* 정비소 예약 다이얼로그 */}
      {garageDialogOpen && selectedGarage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900">{selectedGarage.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{selectedGarage.address}</p>
              </div>
              <button
                onClick={() => setGarageDialogOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">차량</label>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="차량 ID (예: 1)"
                  value={reserveVehicle}
                  onChange={(e) => setReserveVehicle(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">예약 날짜</label>
                  <input
                    type="date"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    value={reserveDate}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setReserveDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">예약 시간</label>
                  <input
                    type="time"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    value={reserveTime}
                    onChange={(e) => setReserveTime(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">메모 (선택)</label>
                <textarea
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
                  rows={2}
                  placeholder="증상 또는 DTC 코드 메모"
                  value={reserveNote}
                  onChange={(e) => setReserveNote(e.target.value)}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setGarageDialogOpen(false)}
                  className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleCreateReservation}
                  disabled={createReservation.isPending}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-40"
                >
                  {createReservation.isPending
                    ? <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    : '예약 확정'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
