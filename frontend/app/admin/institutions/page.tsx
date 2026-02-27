'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { apiClient, User, Institution } from '@/lib/api';
import { PageContainer } from '@/components/admin/page-container';
import { AdminHeader } from '@/components/admin/admin-header';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Building2, CheckCircle, XCircle, Ban, RefreshCw, Clock } from 'lucide-react';

export default function InstitutionsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [pendingInstitutions, setPendingInstitutions] = useState<Institution[]>([]);
  const [allInstitutions, setAllInstitutions] = useState<Institution[]>([]);
  const [selectedTab, setSelectedTab] = useState<'pending' | 'all'>('pending');

  // Modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);
  const [reason, setReason] = useState('');

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
      loadInstitutions();
    }
  }, [user]);

  const loadInstitutions = async () => {
    try {
      const [pending, all] = await Promise.all([
        apiClient.getPendingInstitutions(),
        apiClient.getInstitutions(),
      ]);
      setPendingInstitutions(pending);
      setAllInstitutions(all);
    } catch (error) {
      console.error('Failed to load institutions:', error);
    }
  };

  const handleApprove = async (institutionId: string) => {
    if (!confirm('이 기관을 승인하시겠습니까?')) return;

    setProcessing(true);
    try {
      await apiClient.approveInstitution(institutionId);
      alert('기관이 승인되었습니다.');
      await loadInstitutions();
    } catch (error: any) {
      alert(`승인 실패: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedInstitution || !reason.trim()) {
      alert('거부 사유를 입력해주세요.');
      return;
    }

    setProcessing(true);
    try {
      await apiClient.rejectInstitution(selectedInstitution.id, reason);
      alert('기관이 거부되었습니다.');
      setShowRejectModal(false);
      setSelectedInstitution(null);
      setReason('');
      await loadInstitutions();
    } catch (error: any) {
      alert(`거부 실패: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleSuspend = async () => {
    if (!selectedInstitution || !reason.trim()) {
      alert('정지 사유를 입력해주세요.');
      return;
    }

    setProcessing(true);
    try {
      await apiClient.suspendInstitution(selectedInstitution.id, reason);
      alert('기관이 정지되었습니다.');
      setShowSuspendModal(false);
      setSelectedInstitution(null);
      setReason('');
      await loadInstitutions();
    } catch (error: any) {
      alert(`정지 실패: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleReactivate = async (institutionId: string) => {
    if (!confirm('이 기관을 재활성화하시겠습니까?')) return;

    setProcessing(true);
    try {
      await apiClient.reactivateInstitution(institutionId);
      alert('기관이 재활성화되었습니다.');
      await loadInstitutions();
    } catch (error: any) {
      alert(`재활성화 실패: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800', text: '승인 대기', icon: Clock },
      ACTIVE: { color: 'bg-green-100 text-green-800', text: '활성', icon: CheckCircle },
      SUSPENDED: { color: 'bg-red-100 text-red-800', text: '정지됨', icon: Ban },
      INACTIVE: { color: 'bg-gray-100 text-gray-800', text: '비활성', icon: XCircle },
    };

    const badge = badges[status as keyof typeof badges] || badges.INACTIVE;
    const Icon = badge.icon;

    return (
      <span className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.text}
      </span>
    );
  };

  if (loading) {
    return (
      <PageContainer>
        <LoadingSpinner size="lg" />
      </PageContainer>
    );
  }

  const institutions = selectedTab === 'pending' ? pendingInstitutions : allInstitutions;

  return (
    <PageContainer>
      <AdminHeader
        title="기관 관리"
        subtitle="기관 승인/거부/정지 관리"
        user={user}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Tabs */}
          <div className="flex gap-2">
            <Button
              variant={selectedTab === 'pending' ? 'default' : 'outline'}
              onClick={() => setSelectedTab('pending')}
            >
              승인 대기 ({pendingInstitutions.length})
            </Button>
            <Button
              variant={selectedTab === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedTab('all')}
            >
              전체 기관 ({allInstitutions.length})
            </Button>
          </div>

          {/* Institution List */}
          <div className="grid gap-4">
            {institutions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  {selectedTab === 'pending' ? '승인 대기 중인 기관이 없습니다.' : '등록된 기관이 없습니다.'}
                </CardContent>
              </Card>
            ) : (
              institutions.map((institution) => (
                <Card key={institution.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-grow">
                        <CardTitle className="flex items-center gap-2">
                          <Building2 className="w-5 h-5 text-blue-600" />
                          {institution.name}
                        </CardTitle>
                        <CardDescription>
                          사업자번호: {institution.businessRegistrationNumber}
                        </CardDescription>
                      </div>
                      {institution.status && getStatusBadge(institution.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">주소</p>
                          <p className="font-medium">{institution.address}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">연락처</p>
                          <p className="font-medium">{institution.contact}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">위치 좌표</p>
                          <p className="font-medium text-xs">
                            {institution.latitude?.toFixed(6)}, {institution.longitude?.toFixed(6)}
                          </p>
                        </div>
                        {institution.createdAt && (
                          <div>
                            <p className="text-gray-500">등록일</p>
                            <p className="font-medium">
                              {new Date(institution.createdAt).toLocaleDateString('ko-KR')}
                            </p>
                          </div>
                        )}
                      </div>

                      {institution.rejectionReason && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded">
                          <p className="text-sm text-red-800">
                            <strong>거부 사유:</strong> {institution.rejectionReason}
                          </p>
                        </div>
                      )}

                      {institution.suspensionReason && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                          <p className="text-sm text-yellow-800">
                            <strong>정지 사유:</strong> {institution.suspensionReason}
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        {institution.status === 'PENDING' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(institution.id)}
                              disabled={processing}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              승인
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedInstitution(institution);
                                setShowRejectModal(true);
                              }}
                              disabled={processing}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              거부
                            </Button>
                          </>
                        )}

                        {institution.status === 'ACTIVE' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedInstitution(institution);
                              setShowSuspendModal(true);
                            }}
                            disabled={processing}
                          >
                            <Ban className="w-4 h-4 mr-1" />
                            정지
                          </Button>
                        )}

                        {institution.status === 'SUSPENDED' && (
                          <Button
                            size="sm"
                            onClick={() => handleReactivate(institution.id)}
                            disabled={processing}
                          >
                            <RefreshCw className="w-4 h-4 mr-1" />
                            재활성화
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Reject Modal */}
      {showRejectModal && selectedInstitution && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>기관 거부</CardTitle>
              <CardDescription>
                {selectedInstitution.name}를 거부하시겠습니까?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">거부 사유 *</label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="거부 사유를 입력해주세요."
                    rows={4}
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={processing || !reason.trim()}
                    className="flex-1"
                  >
                    거부
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRejectModal(false);
                      setSelectedInstitution(null);
                      setReason('');
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

      {/* Suspend Modal */}
      {showSuspendModal && selectedInstitution && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>기관 정지</CardTitle>
              <CardDescription>
                {selectedInstitution.name}를 정지하시겠습니까?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">정지 사유 *</label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="정지 사유를 입력해주세요."
                    rows={4}
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    onClick={handleSuspend}
                    disabled={processing || !reason.trim()}
                    className="flex-1"
                  >
                    정지
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowSuspendModal(false);
                      setSelectedInstitution(null);
                      setReason('');
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
