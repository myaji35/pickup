'use client';

import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/**
 * T366: CareTimeWarning Component
 * 케어 시간이 8시간 미만일 때 표시되는 경고 다이얼로그
 */

interface CareTimeWarningProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  careTimeHours: number;
}

export function CareTimeWarning({
  isOpen,
  onClose,
  onConfirm,
  careTimeHours,
}: CareTimeWarningProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            Care Time Warning
          </DialogTitle>
          <DialogDescription className="space-y-3 pt-4">
            <p>
              The care time for this passenger is{' '}
              <span className="font-semibold text-amber-600">
                {careTimeHours.toFixed(1)} hours
              </span>
              , which is less than the minimum required 8 hours.
            </p>
            <p className="text-sm">
              This may not meet the care requirements for daycare facilities.
              Do you want to save this schedule anyway?
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onConfirm} className="bg-amber-600 hover:bg-amber-700">
            Save Anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
