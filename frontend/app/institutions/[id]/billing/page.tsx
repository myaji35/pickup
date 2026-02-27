'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  useBillingStatus,
  usePaymentHistory,
  useInvoices,
  useChangePlan,
} from '@/hooks/queries/use-billing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  CreditCard,
  FileText,
  CheckCircle,
  AlertTriangle,
  Clock,
  ChevronLeft,
} from 'lucide-react';
import Link from 'next/link';

const STATUS_LABEL: Record<string, string> = {
  trial:     '체험 중',
  active:    '활성',
  expired:   '만료',
  cancelled: '해지',
  suspended: '정지',
};

const STATUS_COLOR: Record<string, string> = {
  trial:     'bg-blue-100 text-blue-700',
  active:    'bg-green-100 text-green-700',
  expired:   'bg-gray-100 text-gray-600',
  cancelled: 'bg-gray-100 text-gray-600',
  suspended: 'bg-red-100 text-red-700',
};

const PAYMENT_STATUS_COLOR: Record<string, string> = {
  pending:  'bg-yellow-100 text-yellow-700',
  success:  'bg-green-100 text-green-700',
  failed:   'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-600',
};

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  pending:  '처리 중',
  success:  '성공',
  failed:   '실패',
  refunded: '환불',
};

const PLAN_COLORS: Record<string, string> = {
  basic:       'bg-gray-100 text-gray-800',
  pro:         'bg-blue-100 text-blue-800',
  enterprise:  'bg-purple-100 text-purple-800',
};

/**
 * 기관 결제 & 구독 관리 페이지 — Epic 12
 */
export default function BillingPage() {
  const params = useParams();
  const institutionId = params.id as string;

  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'invoices'>('overview');

  const { data: billingData, isLoading: isLoadingBilling } = useBillingStatus();
  const { data: history = [], isLoading: isLoadingHistory } = usePaymentHistory();
  const { data: invoices = [], isLoading: isLoadingInvoices } = useInvoices();
  const changePlan = useChangePlan();

  const sub = billingData?.subscription;
  const plan = billingData?.plan;

  const handleChangePlan = (planCode: string) => {
    if (!confirm(`${planCode.toUpperCase()} 플랜으로 변경하시겠습니까?`)) return;
    changePlan.mutate(planCode);
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
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            결제 및 구독 관리
          </h1>
          <p className="text-sm text-gray-400">구독 현황, 결제 이력, 인보이스를 관리합니다</p>
        </div>
      </div>

      {/* 현재 구독 상태 카드 */}
      {isLoadingBilling ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin w-6 h-6 text-blue-500" />
        </div>
      ) : sub ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 플랜 정보 */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center justify-between">
                <span>현재 구독 플랜</span>
                <Badge className={PLAN_COLORS[sub.plan_code] ?? 'bg-gray-100 text-gray-700'}>
                  {sub.plan_name}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[sub.status]}`}>
                  {STATUS_LABEL[sub.status]}
                </span>
                {sub.in_trial && sub.trial_ends_at && (
                  <span className="text-xs text-orange-600 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    체험 종료: {new Date(sub.trial_ends_at).toLocaleDateString('ko-KR')}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 text-xs mb-1">월 구독료</p>
                  <p className="font-bold text-gray-900 text-lg">
                    {plan ? `${plan.monthly_price.toLocaleString()}원` : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">다음 결제일</p>
                  <p className="font-medium text-gray-900">
                    {sub.next_billing_date
                      ? new Date(sub.next_billing_date).toLocaleDateString('ko-KR')
                      : '-'}
                  </p>
                  {sub.days_until_billing !== null && sub.days_until_billing <= 7 && (
                    <p className="text-xs text-orange-500 mt-0.5">
                      {sub.days_until_billing}일 후
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">구독 시작일</p>
                  <p className="text-gray-700">
                    {new Date(sub.start_date).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">결제 카드</p>
                  <p className="text-gray-700">
                    {sub.has_billing_key ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        등록됨
                      </span>
                    ) : (
                      <span className="text-red-500 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        미등록
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {sub.failed_payment_count > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                  <p className="text-sm text-red-700 font-medium">
                    ⚠ 결제 실패 {sub.failed_payment_count}회 — 카드 정보를 확인해 주세요.
                  </p>
                </div>
              )}

              {/* 카드 미등록 안내 */}
              {!sub.has_billing_key && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
                  <p className="text-sm text-blue-800 font-medium mb-1">카드 등록이 필요합니다</p>
                  <p className="text-xs text-blue-600">
                    자동 결제를 위해 신용/체크카드를 등록해 주세요.
                    체험 기간 종료 후 카드가 없으면 서비스가 중단될 수 있습니다.
                  </p>
                  <button
                    className="mt-2 text-xs bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700"
                    onClick={() => alert('토스페이먼츠 위젯이 여기에 표시됩니다.\n(프론트엔드 SDK 연동 필요)')}
                  >
                    카드 등록하기
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 플랜 변경 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">플랜 변경</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { code: 'basic',      name: 'BASIC',      price: 300_000, desc: '차량 3대, 승객 50명' },
                { code: 'pro',        name: 'PRO',         price: 800_000, desc: '차량 10대, 승객 300명' },
                { code: 'enterprise', name: 'ENTERPRISE',  price: 2_000_000, desc: '무제한' },
              ].map((p) => (
                <div
                  key={p.code}
                  className={`border rounded-lg p-3 ${sub.plan_code === p.code ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.desc}</p>
                      <p className="text-sm font-bold text-gray-800 mt-1">
                        {p.price.toLocaleString()}원/월
                      </p>
                    </div>
                    {sub.plan_code === p.code ? (
                      <span className="text-xs text-blue-600 font-medium">현재</span>
                    ) : (
                      <button
                        onClick={() => handleChangePlan(p.code)}
                        disabled={changePlan.isPending}
                        className="text-xs px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-40"
                      >
                        변경
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-gray-400">
            <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>구독 정보가 없습니다.</p>
            <p className="text-xs mt-1">슈퍼어드민에게 구독 배정을 요청하세요.</p>
          </CardContent>
        </Card>
      )}

      {/* 탭 */}
      <div className="flex gap-1 border-b border-gray-200">
        {[
          { key: 'history',  label: '결제 이력' },
          { key: 'invoices', label: '인보이스' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as 'history' | 'invoices')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 결제 이력 */}
      {activeTab === 'history' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              결제 이력
              {history.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-400">총 {history.length}건</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingHistory ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin w-5 h-5 text-blue-500" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-10 text-gray-400">결제 이력이 없습니다.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 px-3 text-gray-500 font-medium">결제일</th>
                      <th className="text-left py-2 px-3 text-gray-500 font-medium">주문번호</th>
                      <th className="text-left py-2 px-3 text-gray-500 font-medium">카드</th>
                      <th className="text-right py-2 px-3 text-gray-500 font-medium">금액</th>
                      <th className="text-center py-2 px-3 text-gray-500 font-medium">상태</th>
                      <th className="text-left py-2 px-3 text-gray-500 font-medium">인보이스</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((record) => (
                      <tr key={record.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-2.5 px-3 text-gray-600">
                          {record.paid_at
                            ? new Date(record.paid_at).toLocaleDateString('ko-KR')
                            : new Date(record.created_at).toLocaleDateString('ko-KR')}
                        </td>
                        <td className="py-2.5 px-3 text-gray-500 font-mono text-xs">
                          {record.order_id}
                        </td>
                        <td className="py-2.5 px-3 text-gray-700">
                          {record.card_company ?? '-'}
                          {record.card_number && (
                            <span className="ml-1 text-gray-400 text-xs">{record.card_number}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-medium text-gray-900">
                          {record.amount.toLocaleString()}원
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PAYMENT_STATUS_COLOR[record.status]}`}>
                            {PAYMENT_STATUS_LABEL[record.status]}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          {record.invoice_number ? (
                            <span className="text-xs font-mono text-blue-600">
                              {record.invoice_number}
                            </span>
                          ) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 인보이스 */}
      {activeTab === 'invoices' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-500" />
              인보이스 목록
              {invoices.length > 0 && (
                <span className="ml-1 text-sm font-normal text-gray-400">총 {invoices.length}건</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingInvoices ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin w-5 h-5 text-blue-500" />
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-10 text-gray-400">발행된 인보이스가 없습니다.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 px-3 text-gray-500 font-medium">발행일</th>
                      <th className="text-left py-2 px-3 text-gray-500 font-medium">인보이스 번호</th>
                      <th className="text-right py-2 px-3 text-gray-500 font-medium">공급가액</th>
                      <th className="text-right py-2 px-3 text-gray-500 font-medium">부가세</th>
                      <th className="text-right py-2 px-3 text-gray-500 font-medium">합계</th>
                      <th className="text-center py-2 px-3 text-gray-500 font-medium">상태</th>
                      <th className="text-center py-2 px-3 text-gray-500 font-medium">PDF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-2.5 px-3 text-gray-600">
                          {new Date(inv.issue_date).toLocaleDateString('ko-KR')}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-xs text-blue-700">
                          {inv.invoice_number}
                        </td>
                        <td className="py-2.5 px-3 text-right text-gray-700">
                          {inv.amount.toLocaleString()}원
                        </td>
                        <td className="py-2.5 px-3 text-right text-gray-500">
                          {inv.tax_amount.toLocaleString()}원
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-gray-900">
                          {inv.total.toLocaleString()}원
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                            발행됨
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {inv.pdf_url ? (
                            <a
                              href={inv.pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline"
                            >
                              다운로드
                            </a>
                          ) : (
                            <span className="text-xs text-gray-300">-</span>
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
      )}
    </div>
  );
}
