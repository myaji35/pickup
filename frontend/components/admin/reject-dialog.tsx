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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/**
 * T560: 거부 확인 다이얼로그
 *
 * 회원사 거부 사유 입력 및 실행
 */

interface RejectDialogProps {
  open: boolean;
  onClose: () => void;
  institution: {
    id: string;
    name: string;
    businessRegistrationNo: string;
  };
  onSuccess: () => void;
}

export function RejectDialog({
  open,
  onClose,
  institution,
  onSuccess,
}: RejectDialogProps) {
  const [loading, setLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const { toast } = useToast();

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast({
        title: '거부 사유 필요',
        description: '거부 사유를 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3012/backend/api/v1'}/admin/institutions/${institution.id}/reject`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            rejectionReason,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to reject institution');
      }

      toast({
        title: '거부 완료',
        description: `${institution.name} 회원사가 거부되었습니다.`,
        variant: 'default',
      });

      onSuccess();
    } catch (error) {
      console.error('Rejection failed:', error);
      toast({
        title: '거부 실패',
        description: '회원사 거부 중 오류가 발생했습니다.',
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
            <XCircle className="w-5 h-5 text-red-600" />
            회원사 거부
          </DialogTitle>
          <DialogDescription>
            다음 회원사를 거부하시겠습니까?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">회원사명</p>
            <p className="font-medium">{institution.name}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rejectionReason">거부 사유 *</Label>
            <Textarea
              id="rejectionReason"
              placeholder="거부 사유를 입력하세요 (필수)"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              disabled={loading}
            />
          </div>

          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-sm text-red-900">
              거부 후 회원사는 INACTIVE 상태로 전환되며, 시스템 사용이 불가능합니다.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            취소
          </Button>
          <Button
            onClick={handleReject}
            disabled={loading}
            variant="destructive"
          >
            {loading ? '거부 중...' : '거부'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
