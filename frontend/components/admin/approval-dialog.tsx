'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/**
 * T559: 승인 확인 다이얼로그
 *
 * 회원사 승인 확인 및 실행
 */

interface ApprovalDialogProps {
  open: boolean;
  onClose: () => void;
  institution: {
    id: string;
    name: string;
    businessRegistrationNo: string;
  };
  onSuccess: () => void;
}

export function ApprovalDialog({
  open,
  onClose,
  institution,
  onSuccess,
}: ApprovalDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleApprove = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3012/backend/api/v1'}/admin/institutions/${institution.id}/approve`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to approve institution');
      }

      toast({
        title: '승인 완료',
        description: `${institution.name} 회원사가 승인되었습니다.`,
        variant: 'default',
      });

      onSuccess();
    } catch (error) {
      console.error('Approval failed:', error);
      toast({
        title: '승인 실패',
        description: '회원사 승인 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            회원사 승인
          </DialogTitle>
          <DialogDescription>
            다음 회원사를 승인하시겠습니까?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">회원사명</p>
            <p className="font-medium">{institution.name}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">사업자등록번호</p>
            <p className="font-medium">{institution.businessRegistrationNo}</p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-900">
              승인 후 회원사는 ACTIVE 상태로 전환되며, 시스템 사용이 가능합니다.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            취소
          </Button>
          <Button
            onClick={handleApprove}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? '승인 중...' : '승인'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
