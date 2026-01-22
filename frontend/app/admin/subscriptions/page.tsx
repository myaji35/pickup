'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { apiClient, User, Subscription, Institution, Plan } from '@/lib/api';
import { PageContainer } from '@/components/admin/page-container';
import { AdminHeader } from '@/components/admin/admin-header';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function SubscriptionsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [autoRenew, setAutoRenew] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await apiClient.getCurrentUser();
        setUser(userData);
      } catch (error) {
        router.push('/admin/login');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [router]);

  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user, statusFilter]);

  const loadAllData = async () => {
    try {
      const [subsData, instsData, plansData] = await Promise.all([
        apiClient.getAllSubscriptions(statusFilter || undefined),
        apiClient.getInstitutions(),
        apiClient.getAllPlans(),
      ]);

      setSubscriptions(subsData);
      setInstitutions(instsData);
      setPlans(plansData);
    } catch (error: any) {
      alert('데이터 로드 중 오류가 발생했습니다: ' + error.message);
    }
  };

  const getInstitutionName = (institutionId: string): string => {
    const inst = institutions.find((i) => i.id === institutionId);
    return inst?.name || '알 수 없음';
  };

  const getPlanName = (subscription: Subscription): string => {
    if (subscription.plan) {
      return subscription.plan.name;
    }
    const plan = plans.find((p) => p.id === subscription.planId);
    return plan?.name || '알 수 없음';
  };

  const getStatusBadgeColor = (status: string): string => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'TRIAL':
        return 'bg-blue-100 text-blue-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      case 'EXPIRED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateSubscription = async () => {
    if (!selectedInstitutionId || !selectedPlanId) {
      alert('기관과 요금제를 선택해주세요.');
      return;
    }

    try {
      await apiClient.createInstitutionSubscription(selectedInstitutionId, selectedPlanId, autoRenew);
      alert('구독이 생성되었습니다.');
      setShowCreateModal(false);
      setSelectedInstitutionId('');
      setSelectedPlanId('');
      setAutoRenew(true);
      await loadAllData();
    } catch (error: any) {
      alert('구독 생성 실패: ' + error.message);
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!confirm('정말로 이 구독을 강제 취소하시겠습니까?')) return;

    try {
      await apiClient.forceCancelSubscription(subscriptionId);
      alert('구독이 취소되었습니다.');
      await loadAllData();
    } catch (error: any) {
      alert('구독 취소 실패: ' + error.message);
    }
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
        subtitle="기관별 구독 현황 및 요금제 관리"
        user={user}
      />

      <main className="container mx-auto px-4 py-8">
        {/* 필터 & 액션 */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            <Button
              variant={statusFilter === '' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('')}
            >
              전체
            </Button>
            <Button
              variant={statusFilter === 'ACTIVE' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('ACTIVE')}
            >
              활성
            </Button>
            <Button
              variant={statusFilter === 'TRIAL' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('TRIAL')}
            >
              체험판
            </Button>
            <Button
              variant={statusFilter === 'CANCELLED' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('CANCELLED')}
            >
              취소됨
            </Button>
            <Button
              variant={statusFilter === 'EXPIRED' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('EXPIRED')}
            >
              만료됨
            </Button>
          </div>

          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            구독 생성
          </Button>
        </div>

        {/* 구독 목록 */}
        <div className="grid gap-4">
          {subscriptions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                구독 내역이 없습니다.
              </CardContent>
            </Card>
          ) : (
            subscriptions.map((sub) => (
              <Card key={sub.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {getInstitutionName(sub.institutionId)}
                      </CardTitle>
                      <CardDescription>
                        {getPlanName(sub)} • 구독 ID: {sub.id.slice(0, 8)}...
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
                          sub.status
                        )}`}
                      >
                        {sub.status}
                      </span>
                      {(sub.status === 'ACTIVE' || sub.status === 'TRIAL') && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleCancelSubscription(sub.id)}
                        >
                          취소
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">시작일</p>
                      <p className="font-medium">
                        {new Date(sub.startDate).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">종료일</p>
                      <p className="font-medium">
                        {sub.endDate
                          ? new Date(sub.endDate).toLocaleDateString('ko-KR')
                          : '무기한'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">자동 갱신</p>
                      <p className="font-medium">{sub.autoRenew ? '활성' : '비활성'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">생성일</p>
                      <p className="font-medium">
                        {sub.createdAt
                          ? new Date(sub.createdAt).toLocaleDateString('ko-KR')
                          : '-'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>

      {/* 구독 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>구독 생성</CardTitle>
                  <CardDescription>기관에 새로운 구독을 할당합니다.</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">기관 선택</label>
                <select
                  className="w-full border border-gray-300 rounded-md p-2"
                  value={selectedInstitutionId}
                  onChange={(e) => setSelectedInstitutionId(e.target.value)}
                >
                  <option value="">-- 기관 선택 --</option>
                  {institutions
                    .filter((inst) => inst.status === 'ACTIVE')
                    .map((inst) => (
                      <option key={inst.id} value={inst.id}>
                        {inst.name} ({inst.businessRegistrationNumber})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">요금제 선택</label>
                <select
                  className="w-full border border-gray-300 rounded-md p-2"
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                >
                  <option value="">-- 요금제 선택 --</option>
                  {plans
                    .filter((plan) => plan.isActive)
                    .map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} ({plan.code}) - {plan.monthlyPrice.toLocaleString()}원/월
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoRenew"
                  checked={autoRenew}
                  onChange={(e) => setAutoRenew(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="autoRenew" className="text-sm font-medium">
                  자동 갱신 활성화
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  취소
                </Button>
                <Button onClick={handleCreateSubscription}>생성</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}
