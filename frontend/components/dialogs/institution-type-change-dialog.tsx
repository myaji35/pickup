'use client';

import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { InstitutionType } from '@/types/institution-type';

/**
 * T412: InstitutionTypeChangeDialog Component
 * 기관 유형 변경 확인 다이얼로그
 */

interface InstitutionTypeChangeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentType: InstitutionType | null;
  newType: InstitutionType | null;
  isLoading?: boolean;
}

export function InstitutionTypeChangeDialog({
  isOpen,
  onClose,
  onConfirm,
  currentType,
  newType,
  isLoading = false,
}: InstitutionTypeChangeDialogProps) {
  const hasMinimumCareTime =
    (currentType?.minimumCareTimeHours ?? 0) > 0 ||
    (newType?.minimumCareTimeHours ?? 0) > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Confirm Institution Type Change
          </DialogTitle>
          <DialogDescription className="space-y-4 pt-4">
            <div className="space-y-2">
              <p>You are about to change the institution type:</p>
              <div className="bg-muted p-3 rounded-md space-y-2">
                <div>
                  <span className="text-sm text-muted-foreground">From:</span>
                  <p className="font-medium">
                    {currentType ? (
                      <>
                        {currentType.typeName} ({currentType.typeCode})
                        {currentType.minimumCareTimeHours && (
                          <span className="text-sm text-muted-foreground ml-2">
                            - {currentType.minimumCareTimeHours}h minimum care time
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-muted-foreground">None (No type set)</span>
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">To:</span>
                  <p className="font-medium">
                    {newType ? (
                      <>
                        {newType.typeName} ({newType.typeCode})
                        {newType.minimumCareTimeHours && (
                          <span className="text-sm text-muted-foreground ml-2">
                            - {newType.minimumCareTimeHours}h minimum care time
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-muted-foreground">None (No type set)</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {hasMinimumCareTime && (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-md">
                <p className="text-sm text-amber-800">
                  <strong>⚠️ Care Time Validation:</strong>
                  <br />
                  {newType?.minimumCareTimeHours ? (
                    <>
                      The new type requires <strong>
                        {newType.minimumCareTimeHours} hours
                      </strong>{' '}
                      minimum care time. All passenger schedules must meet this requirement.
                    </>
                  ) : (
                    <>
                      The new type has <strong>no care time validation</strong>. Existing
                      passenger schedules with insufficient care time will no longer show
                      warnings.
                    </>
                  )}
                </p>
              </div>
            )}

            <p className="text-sm">
              This change will affect how passenger care time is validated. Do you want to
              continue?
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Updating...' : 'Confirm Change'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
