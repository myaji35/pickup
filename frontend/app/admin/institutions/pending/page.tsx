'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ApprovalDialog } from '@/components/admin/approval-dialog';
import { RejectDialog } from '@/components/admin/reject-dialog';

/**
 * T556: 승인 대기 페이지
 *
 * PENDING 상태 회원사 목록 조회 및 승인/거부 기능
 */

interface PendingInstitution {
  id: string;
  name: string;
  businessRegistrationNo: string;
  status: string;
  createdAt: string;
}

export default function PendingInstitutionsPage() {
  const { user } = useAuth();
  const [institutions, setInstitutions] = useState<PendingInstitution[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInstitution, setSelectedInstitution] = useState<PendingInstitution | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  useEffect(() => {
    loadPendingInstitutions();
  }, []);

  const loadPendingInstitutions = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3012/backend/api/v1'}/admin/institutions/pending`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load institutions');
      }

      const data = await response.json();
      setInstitutions(data.data || []);
    } catch (error) {
      console.error('Failed to load pending institutions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (institution: PendingInstitution) => {
    setSelectedInstitution(institution);
    setShowApprovalDialog(true);
  };

  const handleReject = (institution: PendingInstitution) => {
    setSelectedInstitution(institution);
    setShowRejectDialog(true);
  };

  const onApprovalSuccess = () => {
    setShowApprovalDialog(false);
    setSelectedInstitution(null);
    loadPendingInstitutions(); // Refresh list
  };

  const onRejectSuccess = () => {
    setShowRejectDialog(false);
    setSelectedInstitution(null);
    loadPendingInstitutions(); // Refresh list
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">승인 대기</h1>
        <p className="text-gray-600 mt-2">
          신규 가입 회원사 승인 관리
        </p>
      </div>

      {/* Stats Card */}
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-yellow-100 rounded-lg">
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">승인 대기 중</p>
            <p className="text-2xl font-bold text-gray-900">{institutions.length}개</p>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>회원사명</TableHead>
              <TableHead>사업자등록번호</TableHead>
              <TableHead>신청일</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className="text-right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {institutions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                  승인 대기 중인 회원사가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              institutions.map((institution) => (
                <TableRow key={institution.id}>
                  <TableCell className="font-medium">{institution.name}</TableCell>
                  <TableCell>{institution.businessRegistrationNo}</TableCell>
                  <TableCell>
                    {new Date(institution.createdAt).toLocaleDateString('ko-KR')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      <Clock className="w-3 h-3 mr-1" />
                      대기중
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600 border-green-600 hover:bg-green-50"
                      onClick={() => handleApprove(institution)}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      승인
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                      onClick={() => handleReject(institution)}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      거부
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Dialogs */}
      {selectedInstitution && (
        <>
          <ApprovalDialog
            open={showApprovalDialog}
            onClose={() => setShowApprovalDialog(false)}
            institution={selectedInstitution}
            onSuccess={onApprovalSuccess}
          />
          <RejectDialog
            open={showRejectDialog}
            onClose={() => setShowRejectDialog(false)}
            institution={selectedInstitution}
            onSuccess={onRejectSuccess}
          />
        </>
      )}
    </div>
  );
}
