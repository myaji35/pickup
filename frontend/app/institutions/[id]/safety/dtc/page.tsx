'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useDtcReports, useAcknowledgeDtc } from '@/hooks/queries/use-safety';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ChevronLeft, CheckCircle } from 'lucide-react';
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

  const { data: reports, isLoading } = useDtcReports({
    status: statusFilter || undefined,
    code:   codeFilter.trim() || undefined,
    limit: 100,
  });

  const acknowledge = useAcknowledgeDtc();

  const handleAcknowledge = (id: number) => {
    acknowledge.mutate(id);
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
    </div>
  );
}
