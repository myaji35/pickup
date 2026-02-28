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
import { AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/**
 * T582: Suspend Dialog
 *
 * Dialog for suspending an active institution
 */

interface SuspendDialogProps {
  open: boolean;
  onClose: () => void;
  institution: {
    id: number | string;
    name: string;
    business_number?: string;
  };
  onSuccess: () => void;
}

export function SuspendDialog({
  open,
  onClose,
  institution,
  onSuccess,
}: SuspendDialogProps) {
  const [loading, setLoading] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');
  const { toast } = useToast();

  const handleSuspend = async () => {
    if (!suspensionReason.trim()) {
      toast({
        title: '정지 사유 필요',
        description: '정지 사유를 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { railsClient } = await import('@/lib/rails-client');
      await railsClient.post(`/admin/institutions/${institution.id}/suspend`, {
        reason: suspensionReason,
      });

      toast({
        title: '정지 완료',
        description: `${institution.name} 회원사가 정지되었습니다.`,
        variant: 'default',
      });

      onSuccess();
    } catch (error) {
      console.error('Suspension failed:', error);
      toast({
        title: '정지 실패',
        description: '회원사 정지 중 오류가 발생했습니다.',
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
            <AlertCircle className="w-5 h-5 text-red-600" />
            회원사 정지
          </DialogTitle>
          <DialogDescription>
            다음 회원사를 정지하시겠습니까?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">회원사명</p>
            <p className="font-medium">{institution.name}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="suspensionReason">정지 사유 *</Label>
            <Textarea
              id="suspensionReason"
              placeholder="정지 사유를 입력하세요 (필수)"
              value={suspensionReason}
              onChange={(e) => setSuspensionReason(e.target.value)}
              rows={4}
              disabled={loading}
            />
          </div>

          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-sm text-red-900">
              정지 후 회원사는 SUSPENDED 상태로 전환되며, 시스템 사용이 제한됩니다.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            취소
          </Button>
          <Button
            onClick={handleSuspend}
            disabled={loading}
            variant="destructive"
          >
            {loading ? '정지 중...' : '정지'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
