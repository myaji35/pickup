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
  Activity,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { SuspendDialog } from '@/components/admin/suspend-dialog';
import { useToast } from '@/hooks/use-toast';

interface InstitutionDetail {
  id: number;
  name: string;
  business_number: string;
  address: string;
  phone: string;
  status: string;
  suspension_reason?: string;
  approved_at?: string;
  suspended_at?: string;
  created_at: string;
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  pending:   { label: '승인대기', className: 'bg-yellow-100 text-yellow-800' },
  active:    { label: '활성',     className: 'bg-green-100 text-green-800' },
  suspended: { label: '정지',     className: 'bg-red-100 text-red-800' },
  inactive:  { label: '비활성',   className: 'bg-gray-100 text-gray-800' },
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
      const { railsClient } = await import('@/lib/rails-client');
      const data = await railsClient.get<InstitutionDetail>(`/admin/institutions/${params.id}`);
      setInstitution(data);
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
      const { railsClient } = await import('@/lib/rails-client');
      await railsClient.post(`/admin/institutions/${params.id}/reactivate`);
      toast({ title: '재활성화 완료', description: `${institution.name} 회원사가 재활성화되었습니다.` });
      loadInstitution();
    } catch (error) {
      console.error('Reactivation failed:', error);
      toast({ title: '재활성화 실패', description: '오류가 발생했습니다.', variant: 'destructive' });
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
        <Button variant="outline" className="mt-4" onClick={() => router.push('/admin/institutions')}>
          목록으로 돌아가기
        </Button>
      </div>
    );
  }

  const statusConfig = STATUS_MAP[institution.status] ?? { label: institution.status, className: 'bg-gray-100 text-gray-800' };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{institution.name}</h1>
          <p className="text-gray-600 mt-2">회원사 상세 정보</p>
        </div>
        <span className={`px-3 py-1 text-sm rounded-full font-medium ${statusConfig.className}`}>
          {statusConfig.label}
        </span>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            기본 정보
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">회원사명</p>
              <p className="font-medium">{institution.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">사업자등록번호</p>
              <p className="font-mono font-medium">{institution.business_number}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">주소</p>
              <p className="font-medium">{institution.address || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">전화번호</p>
              <p className="font-medium">{institution.phone || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">가입일</p>
              <p className="font-medium">{new Date(institution.created_at).toLocaleDateString('ko-KR')}</p>
            </div>
            {institution.approved_at && (
              <div>
                <p className="text-sm text-gray-600">승인일</p>
                <p className="font-medium">{new Date(institution.approved_at).toLocaleDateString('ko-KR')}</p>
              </div>
            )}
            {institution.suspended_at && (
              <>
                <div>
                  <p className="text-sm text-gray-600">정지일</p>
                  <p className="font-medium text-red-600">
                    {new Date(institution.suspended_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600">정지 사유</p>
                  <p className="font-medium text-red-600">{institution.suspension_reason || '-'}</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            관리 작업
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {institution.status === 'active' && (
              <Button variant="destructive" onClick={() => setShowSuspendDialog(true)}>
                <AlertCircle className="w-4 h-4 mr-2" />
                회원사 정지
              </Button>
            )}
            {institution.status === 'suspended' && (
              <Button className="bg-green-600 hover:bg-green-700" onClick={handleReactivate}>
                <CheckCircle className="w-4 h-4 mr-2" />
                재활성화
              </Button>
            )}
            <Button variant="outline" onClick={() => router.push('/admin/institutions')}>
              목록으로
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Suspend Dialog */}
      <SuspendDialog
        open={showSuspendDialog}
        onClose={() => setShowSuspendDialog(false)}
        institution={{ id: institution.id, name: institution.name, business_number: institution.business_number }}
        onSuccess={() => {
          setShowSuspendDialog(false);
          loadInstitution();
        }}
      />
    </div>
  );
}
