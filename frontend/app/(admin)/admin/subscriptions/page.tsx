'use client';

import { useState } from 'react';
import {
  useAdminSubscriptions,
  useAdminChangePlan,
  useAdminActivateSubscription,
  useAdminSuspendSubscription,
} from '@/hooks/queries/use-billing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, ChevronDown } from 'lucide-react';

const STATUS_COLOR: Record<string, string> = {
  trial:     'bg-blue-100 text-blue-700',
  active:    'bg-green-100 text-green-700',
  expired:   'bg-gray-100 text-gray-600',
  cancelled: 'bg-gray-100 text-gray-600',
  suspended: 'bg-red-100 text-red-700',
};

const STATUS_LABEL: Record<string, string> = {
  trial:     '체험',
  active:    '활성',
  expired:   '만료',
  cancelled: '해지',
  suspended: '정지',
};

const PLAN_COLORS: Record<string, string> = {
  basic:       'bg-gray-100 text-gray-800',
  pro:         'bg-blue-100 text-blue-800',
  enterprise:  'bg-purple-100 text-purple-800',
};

/**
 * 슈퍼어드민 구독 관리 페이지 — Epic 12
 */
export default function AdminSubscriptionsPage() {
  const [statusFilter, setStatusFilter] = useState('');

  const { data: subscriptions = [], isLoading } = useAdminSubscriptions(statusFilter || undefined);
  const changePlan    = useAdminChangePlan();
  const activate      = useAdminActivateSubscription();
  const suspend       = useAdminSuspendSubscription();

  const handleChangePlan = (id: number, currentPlan: string) => {
    const plans = ['basic', 'pro', 'enterprise'].filter(p => p !== currentPlan);
    const choice = prompt(`변경할 플랜 코드를 입력하세요:\n${plans.join(' / ')}`);
    if (!choice) return;
    changePlan.mutate({ id, planCode: choice.toLowerCase() });
  };

  const handleActivate = (id: number) => {
    if (!confirm('이 구독을 활성화하시겠습니까?')) return;
    activate.mutate(id);
  };

  const handleSuspend = (id: number) => {
    const reason = prompt('정지 사유를 입력하세요:');
    if (!reason) return;
    suspend.mutate({ id, reason });
  };

  // 집계
  const stats = {
    total:     subscriptions.length,
    active:    subscriptions.filter(s => s.status === 'active').length,
    trial:     subscriptions.filter(s => s.status === 'trial').length,
    suspended: subscriptions.filter(s => s.status === 'suspended').length,
    mrr:       subscriptions
      .filter(s => s.status === 'active')
      .reduce((sum, s) => sum + s.monthly_price, 0),
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-blue-600" />
          구독 관리
        </h1>
        <p className="text-gray-500 mt-1 text-sm">전체 기관 구독 현황 및 플랜 관리</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: '전체 구독', value: stats.total, unit: '건' },
          { label: '활성', value: stats.active, unit: '건', color: 'text-green-600' },
          { label: '체험 중', value: stats.trial, unit: '건', color: 'text-blue-600' },
          { label: '정지', value: stats.suspended, unit: '건', color: 'text-red-600' },
          { label: 'MRR', value: stats.mrr.toLocaleString(), unit: '원', color: 'text-purple-700' },
        ].map((kpi) => (
          <Card key={kpi.label} className="text-center">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-gray-400 mb-1">{kpi.label}</p>
              <p className={`text-xl font-bold ${kpi.color ?? 'text-gray-900'}`}>
                {kpi.value}<span className="text-sm font-normal text-gray-400 ml-0.5">{kpi.unit}</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 필터 */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex gap-2 flex-wrap">
            {['', 'trial', 'active', 'suspended', 'expired', 'cancelled'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                  statusFilter === s
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {s === '' ? '전체' : STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 구독 목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            구독 목록
            {!isLoading && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                총 {subscriptions.length}건
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin w-6 h-6 text-blue-500" />
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="text-center py-12 text-gray-400">구독 데이터가 없습니다.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">기관명</th>
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">플랜</th>
                    <th className="text-center py-2 px-3 text-gray-500 font-medium">상태</th>
                    <th className="text-right py-2 px-3 text-gray-500 font-medium">월 구독료</th>
                    <th className="text-left py-2 px-3 text-gray-500 font-medium">다음 결제일</th>
                    <th className="text-center py-2 px-3 text-gray-500 font-medium">카드</th>
                    <th className="text-center py-2 px-3 text-gray-500 font-medium">실패</th>
                    <th className="text-right py-2 px-3 text-gray-500 font-medium">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((sub) => (
                    <tr
                      key={sub.id}
                      className={`border-b border-gray-50 hover:bg-gray-50 ${
                        sub.status === 'suspended' ? 'bg-red-50/20' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-medium text-gray-900">
                        {sub.institution_name}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLAN_COLORS[sub.plan_code] ?? 'bg-gray-100 text-gray-700'}`}>
                          {sub.plan_name}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[sub.status]}`}>
                          {STATUS_LABEL[sub.status]}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-gray-700 font-medium">
                        {sub.monthly_price.toLocaleString()}원
                      </td>
                      <td className="py-2.5 px-3 text-gray-500">
                        {sub.next_billing_date
                          ? new Date(sub.next_billing_date).toLocaleDateString('ko-KR')
                          : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`text-xs ${sub.has_billing_key ? 'text-green-600' : 'text-red-400'}`}>
                          {sub.has_billing_key ? '등록' : '미등록'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {sub.failed_payment_count > 0 ? (
                          <span className="text-xs font-bold text-red-600">
                            {sub.failed_payment_count}회
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleChangePlan(sub.id, sub.plan_code)}
                            className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50"
                          >
                            플랜
                          </button>
                          {sub.status !== 'active' && (
                            <button
                              onClick={() => handleActivate(sub.id)}
                              disabled={activate.isPending}
                              className="text-xs text-green-600 hover:text-green-800 px-2 py-1 rounded hover:bg-green-50"
                            >
                              활성화
                            </button>
                          )}
                          {sub.status === 'active' && (
                            <button
                              onClick={() => handleSuspend(sub.id)}
                              disabled={suspend.isPending}
                              className="text-xs text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50"
                            >
                              정지
                            </button>
                          )}
                        </div>
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
