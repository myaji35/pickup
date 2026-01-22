'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apiClient, User, Plan, CreatePlanRequest, UpdatePlanRequest } from '@/lib/api';
import { PageContainer } from '@/components/admin/page-container';
import { AdminHeader } from '@/components/admin/admin-header';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Package, Plus, Edit, Trash2, Check, X } from 'lucide-react';

export default function PlansPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [plans, setPlans] = useState<Plan[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreatePlanRequest>({
    name: '',
    code: '',
    maxVehicles: 0,
    maxPassengers: 0,
    monthlyPrice: 0,
    features: [],
  });
  const [featuresText, setFeaturesText] = useState('');

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
      loadPlans();
    }
  }, [user]);

  const loadPlans = async () => {
    try {
      const plansData = await apiClient.getAllPlans();
      setPlans(plansData);
    } catch (error) {
      console.error('Failed to load plans:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      maxVehicles: 0,
      maxPassengers: 0,
      monthlyPrice: 0,
      features: [],
    });
    setFeaturesText('');
    setSelectedPlan(null);
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.code) {
      alert('필수 항목을 입력해주세요.');
      return;
    }

    setProcessing(true);
    try {
      const features = featuresText
        .split('\n')
        .map((f) => f.trim())
        .filter((f) => f.length > 0);

      await apiClient.createPlan({
        ...formData,
        features,
      });

      alert('요금제가 생성되었습니다.');
      setShowCreateModal(false);
      resetForm();
      await loadPlans();
    } catch (error: any) {
      alert(`생성 실패: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedPlan) return;

    setProcessing(true);
    try {
      const features = featuresText
        .split('\n')
        .map((f) => f.trim())
        .filter((f) => f.length > 0);

      const updateData: UpdatePlanRequest = {
        name: formData.name || undefined,
        maxVehicles: formData.maxVehicles || undefined,
        maxPassengers: formData.maxPassengers || undefined,
        monthlyPrice: formData.monthlyPrice || undefined,
        features: features.length > 0 ? features : undefined,
      };

      await apiClient.updatePlan(selectedPlan.id, updateData);
      alert('요금제가 수정되었습니다.');
      setShowEditModal(false);
      resetForm();
      await loadPlans();
    } catch (error: any) {
      alert(`수정 실패: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (planId: string, planName: string) => {
    if (!confirm(`"${planName}" 요금제를 삭제하시겠습니까?`)) return;

    setProcessing(true);
    try {
      await apiClient.deletePlan(planId);
      alert('요금제가 삭제되었습니다.');
      await loadPlans();
    } catch (error: any) {
      alert(`삭제 실패: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const openEditModal = (plan: Plan) => {
    setSelectedPlan(plan);
    setFormData({
      name: plan.name,
      code: plan.code,
      maxVehicles: plan.maxVehicles,
      maxPassengers: plan.maxPassengers,
      monthlyPrice: plan.monthlyPrice,
      features: plan.features,
    });
    setFeaturesText(plan.features.join('\n'));
    setShowEditModal(true);
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
        user={user}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header Actions */}
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">요금제 목록 ({plans.length})</h2>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              새 요금제 생성
            </Button>
          </div>

          {/* Plans Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <Card key={plan.id} className={!plan.isActive ? 'opacity-60' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-blue-600" />
                        {plan.name}
                      </CardTitle>
                      <CardDescription>{plan.code}</CardDescription>
                    </div>
                    {plan.isActive ? (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        활성
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded flex items-center gap-1">
                        <X className="w-3 h-3" />
                        비활성
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-3xl font-bold text-blue-600">
                      ₩{plan.monthlyPrice.toLocaleString()}
                      <span className="text-sm text-gray-500 font-normal">/월</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-500">최대 차량</p>
                        <p className="font-semibold">{plan.maxVehicles}대</p>
                      </div>
                      <div>
                        <p className="text-gray-500">최대 승객</p>
                        <p className="font-semibold">{plan.maxPassengers}명</p>
                      </div>
                    </div>

                    {plan.features.length > 0 && (
                      <div className="border-t pt-3">
                        <p className="text-sm font-medium mb-2">포함된 기능:</p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {plan.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditModal(plan)}
                        disabled={processing}
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        수정
                      </Button>
                      {plan.isActive && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(plan.id, plan.name)}
                          disabled={processing}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-md my-4">
            <CardHeader>
              <CardTitle>새 요금제 생성</CardTitle>
              <CardDescription>새로운 구독 요금제를 생성합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">요금제 이름 *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="예: 스타터, 프로, 엔터프라이즈"
                  />
                </div>
                <div>
                  <Label htmlFor="code">요금제 코드 *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="예: STARTER, PRO, ENTERPRISE"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="maxVehicles">최대 차량</Label>
                    <Input
                      id="maxVehicles"
                      type="number"
                      value={formData.maxVehicles}
                      onChange={(e) => setFormData({ ...formData, maxVehicles: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxPassengers">최대 승객</Label>
                    <Input
                      id="maxPassengers"
                      type="number"
                      value={formData.maxPassengers}
                      onChange={(e) => setFormData({ ...formData, maxPassengers: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="monthlyPrice">월 요금 (원)</Label>
                  <Input
                    id="monthlyPrice"
                    type="number"
                    value={formData.monthlyPrice}
                    onChange={(e) => setFormData({ ...formData, monthlyPrice: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="features">포함 기능 (한 줄에 하나씩)</Label>
                  <Textarea
                    id="features"
                    value={featuresText}
                    onChange={(e) => setFeaturesText(e.target.value)}
                    placeholder="실시간 차량 추적&#10;경로 최적화&#10;승객 관리&#10;운행 리포트"
                    rows={5}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleCreate}
                    disabled={processing || !formData.name || !formData.code}
                    className="flex-1"
                  >
                    생성
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    disabled={processing}
                    className="flex-1"
                  >
                    취소
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-md my-4">
            <CardHeader>
              <CardTitle>요금제 수정</CardTitle>
              <CardDescription>{selectedPlan.name} 요금제를 수정합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">요금제 이름</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-code">요금제 코드 (수정 불가)</Label>
                  <Input
                    id="edit-code"
                    value={formData.code}
                    disabled
                    className="bg-gray-100"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-maxVehicles">최대 차량</Label>
                    <Input
                      id="edit-maxVehicles"
                      type="number"
                      value={formData.maxVehicles}
                      onChange={(e) => setFormData({ ...formData, maxVehicles: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-maxPassengers">최대 승객</Label>
                    <Input
                      id="edit-maxPassengers"
                      type="number"
                      value={formData.maxPassengers}
                      onChange={(e) => setFormData({ ...formData, maxPassengers: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-monthlyPrice">월 요금 (원)</Label>
                  <Input
                    id="edit-monthlyPrice"
                    type="number"
                    value={formData.monthlyPrice}
                    onChange={(e) => setFormData({ ...formData, monthlyPrice: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-features">포함 기능 (한 줄에 하나씩)</Label>
                  <Textarea
                    id="edit-features"
                    value={featuresText}
                    onChange={(e) => setFeaturesText(e.target.value)}
                    rows={5}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleUpdate}
                    disabled={processing}
                    className="flex-1"
                  >
                    수정
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEditModal(false);
                      resetForm();
                    }}
                    disabled={processing}
                    className="flex-1"
                  >
                    취소
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}
