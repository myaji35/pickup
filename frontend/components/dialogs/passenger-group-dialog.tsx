'use client';

import { PassengerGroup } from '@/types/passenger-group';
import { PassengerGroupFormData } from '@/lib/schemas/passenger-group.schema';
import { PassengerGroupForm } from '@/components/forms/passenger-group-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PassengerGroupDialogProps {
  institutionId: string;
  group?: PassengerGroup;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PassengerGroupFormData) => void;
  isLoading?: boolean;
}

/**
 * PassengerGroupDialog Component
 * 승객 그룹 생성/수정 다이얼로그
 */
export function PassengerGroupDialog({
  institutionId,
  group,
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
}: PassengerGroupDialogProps) {
  const isEditMode = !!group;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Passenger Group' : 'Create New Passenger Group'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the passenger group information below.'
              : 'Create a new passenger group by filling out the form below.'}
          </DialogDescription>
        </DialogHeader>
        <PassengerGroupForm
          institutionId={institutionId}
          defaultValues={
            group
              ? {
                  institutionId,
                  groupCode: group.groupCode,
                  name: group.name,
                }
              : undefined
          }
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
          isLoading={isLoading}
          isEditMode={isEditMode}
        />
      </DialogContent>
    </Dialog>
  );
}
