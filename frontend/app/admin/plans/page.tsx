'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/auth-context';
import { PageContainer } from '@/components/admin/page-container';
import { AdminHeader } from '@/components/admin/admin-header';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { CreditCard, Plus, Edit, Trash2, CheckCircle } from 'lucide-react';

interface Plan {
  id: number;
  name: string;
  code: string;
  monthly_price: number;
  max_vehicles: number | null;
  max_passengers: number | null;
  features: string | null;
  is_active: boolean;
}

export default function PlansPage() {
  const { user, loading: authLoading } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    monthly_price: '',
    max_vehicles: '',
    max_passengers: '',
  });

  useEffect(() => {
    if (!authLoading) loadPlans();
  }, [authLoading]);

  const loadPlans = async () => {
    try {
      const { railsClient } = await import('@/lib/rails-client');
      const data = await railsClient.get<Plan[]>('/admin/plans');
      setPlans(data ?? []);
    } catch (error) {
      console.error('Failed to load plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    try {
      const { railsClient } = await import('@/lib/rails-client');
      await railsClient.post('/admin/plans', {
        plan: {
          name: formData.name,
          code: formData.code.toUpperCase(),
          monthly_price: parseInt(formData.monthly_price) || 0,
          max_vehicles: formData.max_vehicles ? parseInt(formData.max_vehicles) : null,
          max_passengers: formData.max_passengers ? parseInt(formData.max_passengers) : null,
          is_active: true,
        },
      });
      setShowCreateForm(false);
      setFormData({ name: '', code: '', monthly_price: '', max_vehicles: '', max_passengers: '' });
      await loadPlans();
    } catch (error: any) {
      alert(`생성 실패: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    setProcessing(true);
    try {
      const { railsClient } = await import('@/lib/rails-client');
      await railsClient.patch(`/admin/plans/${editingPlan.id}`, {
        plan: {
          name: formData.name,
          monthly_price: parseInt(formData.monthly_price) || 0,
          max_vehicles: formData.max_vehicles ? parseInt(formData.max_vehicles) : null,
          max_passengers: formData.max_passengers ? parseInt(formData.max_passengers) : null,
        },
      });
      setEditingPlan(null);
      await loadPlans();
    } catch (error: any) {
      alert(`수정 실패: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (planId: number) => {
    if (!confirm('이 요금제를 비활성화하시겠습니까?')) return;
    setProcessing(true);
    try {
      const { railsClient } = await import('@/lib/rails-client');
      await railsClient.delete(`/admin/plans/${planId}`);
      await loadPlans();
    } catch (error: any) {
      alert(`삭제 실패: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const startEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      code: plan.code,
      monthly_price: String(plan.monthly_price),
      max_vehicles: plan.max_vehicles ? String(plan.max_vehicles) : '',
      max_passengers: plan.max_passengers ? String(plan.max_passengers) : '',
    });
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
        title="요금제 관리"
        subtitle="구독 플랜 생성/수정/삭제"
        user={user as any}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">요금제 목록 ({plans.length}개)</h2>
            <Button onClick={() => setShowCreateForm(true)} disabled={processing}>
              <Plus className="w-4 h-4 mr-2" />
              요금제 추가
            </Button>
          </div>

          {/* Create Form */}
          {showCreateForm && (
            <Card>
              <CardHeader>
                <CardTitle>새 요금제 추가</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>요금제명</Label>
                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                  </div>
                  <div>
                    <Label>코드</Label>
                    <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="STARTER" required />
                  </div>
                  <div>
                    <Label>월 요금 (원)</Label>
                    <Input type="number" value={formData.monthly_price} onChange={(e) => setFormData({ ...formData, monthly_price: e.target.value })} required />
                  </div>
                  <div>
                    <Label>최대 차량 수</Label>
                    <Input type="number" value={formData.max_vehicles} onChange={(e) => setFormData({ ...formData, max_vehicles: e.target.value })} placeholder="무제한" />
                  </div>
                  <div className="col-span-2 flex gap-2">
                    <Button type="submit" disabled={processing}>{processing ? '저장 중...' : '저장'}</Button>
                    <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>취소</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Plans Grid */}
          <div className="grid md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <Card key={plan.id} className={plan.is_active ? '' : 'opacity-50'}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-blue-600" />
                        {plan.name}
                      </CardTitle>
                      <CardDescription>{plan.code}</CardDescription>
                    </div>
                    {plan.is_active && <CheckCircle className="w-5 h-5 text-green-600" />}
                  </div>
                </CardHeader>
                <CardContent>
                  {editingPlan?.id === plan.id ? (
                    <form onSubmit={handleUpdate} className="space-y-3">
                      <div>
                        <Label>요금제명</Label>
                        <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                      </div>
                      <div>
                        <Label>월 요금</Label>
                        <Input type="number" value={formData.monthly_price} onChange={(e) => setFormData({ ...formData, monthly_price: e.target.value })} />
                      </div>
                      <div>
                        <Label>최대 차량</Label>
                        <Input type="number" value={formData.max_vehicles} onChange={(e) => setFormData({ ...formData, max_vehicles: e.target.value })} placeholder="무제한" />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" size="sm" disabled={processing}>저장</Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => setEditingPlan(null)}>취소</Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <p className="text-2xl font-bold text-blue-600">
                          {plan.monthly_price === 0 ? '무료' : `₩${plan.monthly_price.toLocaleString()}/월`}
                        </p>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>차량: {plan.max_vehicles ? `최대 ${plan.max_vehicles}대` : '무제한'}</p>
                        <p>승객: {plan.max_passengers ? `최대 ${plan.max_passengers}명` : '무제한'}</p>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" onClick={() => startEdit(plan)}>
                          <Edit className="w-4 h-4 mr-1" /> 수정
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(plan.id)} disabled={processing}>
                          <Trash2 className="w-4 h-4 mr-1" /> 비활성화
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </PageContainer>
  );
}
