'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useSafetyEvents } from '@/hooks/queries/use-safety';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

const EVENT_TYPE_KR: Record<string, string> = {
  harsh_accel: '급가속',
  harsh_brake: '급제동',
  speeding:    '과속',
  idling:      '공회전',
};

const EVENT_COLOR: Record<string, string> = {
  harsh_accel: 'bg-orange-100 text-orange-800',
  harsh_brake: 'bg-red-100 text-red-800',
  speeding:    'bg-yellow-100 text-yellow-800',
  idling:      'bg-gray-100 text-gray-700',
};

/**
 * 안전 이벤트 목록 페이지 — Epic 7 Phase B
 */
export default function SafetyEventsPage() {
  const params = useParams();
  const institutionId = params.id as string;

  const [eventType, setEventType] = useState('');
  const [dateFrom, setDateFrom]   = useState('');
  const [dateTo, setDateTo]       = useState('');

  const { data: events, isLoading } = useSafetyEvents({
    event_type: eventType || undefined,
    date_from:  dateFrom  || undefined,
    date_to:    dateTo    || undefined,
    limit: 100,
  });

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
          <h1 className="text-xl font-bold text-gray-900">안전 이벤트 목록</h1>
          <p className="text-sm text-gray-400">드라이버별 급가속·급제동·과속·공회전 이력</p>
        </div>
      </div>

      {/* 필터 */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3">
            <select
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
            >
              <option value="">전체 유형</option>
              {Object.entries(EVENT_TYPE_KR).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>

            <input
              type="date"
              className="text-sm border border-gray-200 rounded-lg px-3 py-2"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="시작 날짜"
            />
            <input
              type="date"
              className="text-sm border border-gray-200 rounded-lg px-3 py-2"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="종료 날짜"
            />

            <button
              onClick={() => { setEventType(''); setDateFrom(''); setDateTo(''); }}
              className="text-sm text-gray-400 hover:text-gray-600 px-2"
            >
              초기화
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 이벤트 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            이벤트 목록
            {events && <span className="ml-2 text-sm font-normal text-gray-400">총 {events.length}건</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin w-6 h-6 text-blue-500" />
            </div>
          ) : !events?.length ? (
            <div className="text-center py-12 text-gray-400">
              <p>조건에 해당하는 이벤트가 없습니다.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">발생 시각</th>
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">드라이버</th>
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">유형</th>
                    <th className="text-right py-2 px-3 text-gray-500 font-medium">속도(km/h)</th>
                    <th className="text-right py-2 px-3 text-gray-500 font-medium">RPM</th>
                    <th className="text-right py-2 px-3 text-gray-500 font-medium">운행 ID</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((ev) => (
                    <tr key={ev.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2.5 px-3 text-gray-600">
                        {new Date(ev.occurred_at).toLocaleString('ko-KR', {
                          month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-gray-900">
                        {ev.driver.name}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${EVENT_COLOR[ev.event_type]}`}>
                          {EVENT_TYPE_KR[ev.event_type] ?? ev.event_type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-gray-700">
                        {ev.speed ? ev.speed.toFixed(0) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right text-gray-500">
                        {ev.rpm ? Math.round(ev.rpm).toLocaleString() : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right text-gray-400">
                        #{ev.trip_id}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
