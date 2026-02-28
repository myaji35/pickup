'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';
import { PageContainer } from '@/components/admin/page-container';
import { AdminHeader } from '@/components/admin/admin-header';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Receipt, RefreshCw, Ban, XCircle, CreditCard } from 'lucide-react';

interface Subscription {
  id: number;
  institution_id: number;
  institution_name: string;
  plan_code: string;
  plan_name: string;
  monthly_price: number;
  status: string;
  start_date: string | null;
  next_billing_date: string | null;
  failed_payment_count: number;
  has_billing_key: boolean;
  notes: string | null;
  created_at: string;
}

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadSubscriptions();
  }, [statusFilter]);

  const loadSubscriptions = async () => {
    try {
      const { railsClient } = await import('@/lib/rails-client');
      const url = statusFilter ? `/admin/subscriptions?status=${statusFilter}` : '/admin/subscriptions';
      const data = await railsClient.get<Subscription[]>(url);
      setSubscriptions(data ?? []);
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (subId: number, action: 'activate' | 'suspend' | 'cancel' | 'charge') => {
    const labels: Record<string, string> = { activate: '활성화', suspend: '정지', cancel: '해지', charge: '수동 결제' };
    if (!confirm(`${labels[action]}하시겠습니까?`)) return;
    setProcessing(subId);
    try {
      const { railsClient } = await import('@/lib/rails-client');
      await railsClient.post(`/admin/subscriptions/${subId}/${action}`);
      alert(`${labels[action]}되었습니다.`);
      await loadSubscriptions();
    } catch (error: any) {
      alert(`실패: ${error.message}`);
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { className: string; label: string }> = {
      trial:     { className: 'bg-blue-100 text-blue-800',   label: '체험' },
      active:    { className: 'bg-green-100 text-green-800', label: '활성' },
      suspended: { className: 'bg-red-100 text-red-800',     label: '정지' },
      cancelled: { className: 'bg-gray-100 text-gray-800',   label: '해지' },
    };
    const c = config[status] || config.cancelled;
    return <span className={`px-2 py-1 text-xs rounded ${c.className}`}>{c.label}</span>;
  };

  if (loading) {
    return (
      <PageContainer>
        <LoadingSpinner size="lg" />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <AdminHeader
        title="구독 관리"
        subtitle="기관별 구독 현황 및 관리"
        user={user as any}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* 필터 */}
          <div className="flex gap-2 flex-wrap">
            {['', 'trial', 'active', 'suspended', 'cancelled'].map((s) => (
              <Button
                key={s}
                variant={statusFilter === s ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(s)}
              >
                {s === '' ? '전체' : s === 'trial' ? '체험' : s === 'active' ? '활성' : s === 'suspended' ? '정지' : '해지'}
                {s === statusFilter && subscriptions.length > 0 && ` (${subscriptions.length})`}
              </Button>
            ))}
          </div>

          {/* 구독 목록 */}
          {subscriptions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                구독 데이터가 없습니다.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {subscriptions.map((sub) => (
                <Card key={sub.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Receipt className="w-5 h-5 text-blue-600" />
                          {sub.institution_name}
                        </CardTitle>
                        <CardDescription>
                          {sub.plan_name} ({sub.plan_code}) — ₩{sub.monthly_price.toLocaleString()}/월
                        </CardDescription>
                      </div>
                      {getStatusBadge(sub.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-gray-500">빌링키</p>
                        <p className="font-medium">{sub.has_billing_key ? '등록됨' : '미등록'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">다음 결제일</p>
                        <p className="font-medium">
                          {sub.next_billing_date
                            ? new Date(sub.next_billing_date).toLocaleDateString('ko-KR')
                            : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">결제 실패 횟수</p>
                        <p className={`font-medium ${sub.failed_payment_count > 0 ? 'text-red-600' : ''}`}>
                          {sub.failed_payment_count}회
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">등록일</p>
                        <p className="font-medium">
                          {new Date(sub.created_at).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {sub.status !== 'active' && (
                        <Button
                          size="sm"
                          onClick={() => handleAction(sub.id, 'activate')}
                          disabled={processing === sub.id}
                        >
                          <RefreshCw className="w-4 h-4 mr-1" /> 활성화
                        </Button>
                      )}
                      {sub.status === 'active' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleAction(sub.id, 'suspend')}
                          disabled={processing === sub.id}
                        >
                          <Ban className="w-4 h-4 mr-1" /> 정지
                        </Button>
                      )}
                      {sub.status !== 'cancelled' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAction(sub.id, 'cancel')}
                          disabled={processing === sub.id}
                        >
                          <XCircle className="w-4 h-4 mr-1" /> 해지
                        </Button>
                      )}
                      {sub.has_billing_key && sub.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-blue-600 border-blue-600 hover:bg-blue-50"
                          onClick={() => handleAction(sub.id, 'charge')}
                          disabled={processing === sub.id}
                        >
                          <CreditCard className="w-4 h-4 mr-1" /> 수동 결제
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </PageContainer>
  );
}
