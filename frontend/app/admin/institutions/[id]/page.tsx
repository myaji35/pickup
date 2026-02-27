'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  CheckCircle,
  Building2,
  Calendar,
  User,
  CreditCard,
  Activity,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { SuspendDialog } from '@/components/admin/suspend-dialog';
import { useToast } from '@/hooks/use-toast';

/**
 * T576-T585: Institution Detail Page
 *
 * View institution details and manage status (suspend/reactivate)
 */

interface InstitutionDetail {
  id: string;
  name: string;
  businessRegistrationNo: string;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  rejectionReason?: string;
  approvedAt?: string;
  approvedBy?: string;
  suspendedAt?: string;
  suspensionReason?: string;
  createdAt: string;
}

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACTIVE: 'bg-green-100 text-green-800',
  SUSPENDED: 'bg-red-100 text-red-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
};

const statusLabels = {
  PENDING: '승인대기',
  ACTIVE: '활성',
  SUSPENDED: '정지',
  INACTIVE: '비활성',
};

export default function InstitutionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [institution, setInstitution] = useState<InstitutionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);

  useEffect(() => {
    loadInstitution();
  }, [params.id]);

  const loadInstitution = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3012/backend/api/v1'}/admin/institutions/${params.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load institution');
      }

      const data = await response.json();
      setInstitution(data.data);
    } catch (error) {
      console.error('Failed to load institution:', error);
      toast({
        title: '오류',
        description: '회원사 정보를 불러올 수 없습니다.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReactivate = async () => {
    if (!institution) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3012/backend/api/v1'}/admin/institutions/${params.id}/reactivate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to reactivate institution');
      }

      toast({
        title: '재활성화 완료',
        description: `${institution.name} 회원사가 재활성화되었습니다.`,
      });

      loadInstitution();
    } catch (error) {
      console.error('Reactivation failed:', error);
      toast({
        title: '재활성화 실패',
        description: '회원사 재활성화 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner />
      </div>
    );
  }

  if (!institution) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96">
        <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">회원사를 찾을 수 없습니다</h2>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push('/admin/institutions')}
        >
          목록으로 돌아가기
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{institution.name}</h1>
          <p className="text-gray-600 mt-2">회원사 상세 정보</p>
        </div>
        <Badge className={statusColors[institution.status]} variant="outline">
          {statusLabels[institution.status]}
        </Badge>
      </div>

      {/* Basic Information - T577 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            기본 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">회원사명</p>
              <p className="font-medium">{institution.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">사업자등록번호</p>
              <p className="font-mono font-medium">{institution.businessRegistrationNo}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">상태</p>
              <Badge className={statusColors[institution.status]} variant="outline">
                {statusLabels[institution.status]}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600">가입일</p>
              <p className="font-medium">
                {new Date(institution.createdAt).toLocaleDateString('ko-KR')}
              </p>
            </div>
            {institution.approvedAt && (
              <>
                <div>
                  <p className="text-sm text-gray-600">승인일</p>
                  <p className="font-medium">
                    {new Date(institution.approvedAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">승인자</p>
                  <p className="font-medium">{institution.approvedBy || '-'}</p>
                </div>
              </>
            )}
            {institution.suspendedAt && (
              <>
                <div>
                  <p className="text-sm text-gray-600">정지일</p>
                  <p className="font-medium text-red-600">
                    {new Date(institution.suspendedAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600">정지 사유</p>
                  <p className="font-medium text-red-600">
                    {institution.suspensionReason || '-'}
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions - T581 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            관리 작업
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {institution.status === 'ACTIVE' && (
              <Button
                variant="destructive"
                onClick={() => setShowSuspendDialog(true)}
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                회원사 정지
              </Button>
            )}
            {institution.status === 'SUSPENDED' && (
              <Button
                variant="default"
                className="bg-green-600 hover:bg-green-700"
                onClick={handleReactivate}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                재활성화
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => router.push('/admin/institutions')}
            >
              목록으로
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Suspend Dialog */}
      {institution && (
        <SuspendDialog
          open={showSuspendDialog}
          onClose={() => setShowSuspendDialog(false)}
          institution={institution}
          onSuccess={() => {
            setShowSuspendDialog(false);
            loadInstitution();
          }}
        />
      )}
    </div>
  );
}
