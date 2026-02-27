'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScheduleTimeInput } from '@/components/inputs/schedule-time-input';
import { CareTimeDisplay } from '@/components/display/care-time-display';
import { CareTimeWarning } from '@/components/display/care-time-warning';
import { useUpsertPassengerSchedule } from '@/hooks/mutations/use-upsert-passenger-schedule';
import { useDeletePassengerSchedule } from '@/hooks/mutations/use-delete-passenger-schedule';
import { passengerScheduleSchema, PassengerScheduleFormData } from '@/lib/schemas/passenger-schedule.schema';
import { PassengerSchedule } from '@/types/passenger-schedule';
import { Loader2, Trash2 } from 'lucide-react';

/**
 * T367-T370: ScheduleEditDialog Component
 * 승객 스케줄 편집 다이얼로그 (탑승/하차 시간, 실시간 케어 시간 계산, 경고)
 */

interface ScheduleEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  passengerId: string;
  passengerName: string;
  existingSchedule?: PassengerSchedule | null;
}

export function ScheduleEditDialog({
  isOpen,
  onClose,
  passengerId,
  passengerName,
  existingSchedule,
}: ScheduleEditDialogProps) {
  const [pickupTime, setPickupTime] = useState('');
  const [dropoffTime, setDropoffTime] = useState('');
  const [showWarning, setShowWarning] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);

  const upsertMutation = useUpsertPassengerSchedule();
  const deleteMutation = useDeletePassengerSchedule();

  const {
    formState: { errors },
    setValue,
    trigger,
  } = useForm<PassengerScheduleFormData>({
    resolver: zodResolver(passengerScheduleSchema),
  });

  // 기존 스케줄 로드
  useEffect(() => {
    if (existingSchedule) {
      setPickupTime(existingSchedule.pickupTime);
      setDropoffTime(existingSchedule.dropoffTime);
      setValue('pickupTime', existingSchedule.pickupTime);
      setValue('dropoffTime', existingSchedule.dropoffTime);
    } else {
      setPickupTime('');
      setDropoffTime('');
    }
  }, [existingSchedule, setValue]);

  // T368: 실시간 케어 시간 계산
  const calculateCareTime = () => {
    if (!pickupTime || !dropoffTime) return null;

    const timeRegex = /^([0-1]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(pickupTime) || !timeRegex.test(dropoffTime)) return null;

    const [pickupHour, pickupMin] = pickupTime.split(':').map(Number);
    const [dropoffHour, dropoffMin] = dropoffTime.split(':').map(Number);

    const pickupMinutes = pickupHour * 60 + pickupMin;
    const dropoffMinutes = dropoffHour * 60 + dropoffMin;

    if (pickupMinutes >= dropoffMinutes) return null;

    const diffMinutes = dropoffMinutes - pickupMinutes;
    return diffMinutes / 60;
  };

  const careTimeHours = calculateCareTime();
  const isCareTimeInsufficient = careTimeHours !== null && careTimeHours < 8;

  const handleSubmit = async () => {
    // 검증
    setValue('pickupTime', pickupTime);
    setValue('dropoffTime', dropoffTime);
    const isValid = await trigger();

    if (!isValid) return;

    // T369: 8시간 미만이면 경고 다이얼로그 표시
    if (isCareTimeInsufficient && !pendingSubmit) {
      setShowWarning(true);
      return;
    }

    // 저장
    try {
      await upsertMutation.mutateAsync({
        passengerId,
        data: {
          pickupTime,
          dropoffTime,
        },
      });
      onClose();
      setPickupTime('');
      setDropoffTime('');
      setPendingSubmit(false);
    } catch (error) {
      console.error('Failed to save schedule:', error);
    }
  };

  // T370: "Save anyway" 확인
  const handleConfirmWarning = () => {
    setShowWarning(false);
    setPendingSubmit(true);
    handleSubmit();
  };

  const handleDelete = async () => {
    if (!existingSchedule) return;

    try {
      await deleteMutation.mutateAsync(passengerId);
      onClose();
    } catch (error) {
      console.error('Failed to delete schedule:', error);
    }
  };

  const handleClose = () => {
    setPickupTime('');
    setDropoffTime('');
    setPendingSubmit(false);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Schedule for {passengerName}</DialogTitle>
            <DialogDescription>
              Set pickup and dropoff times. Minimum 8 hours of care time is recommended.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* T367: 스케줄 필드 */}
            <ScheduleTimeInput
              label="Pickup Time"
              value={pickupTime}
              onChange={setPickupTime}
              error={errors.pickupTime?.message}
              placeholder="08:00"
            />

            <ScheduleTimeInput
              label="Dropoff Time"
              value={dropoffTime}
              onChange={setDropoffTime}
              error={errors.dropoffTime?.message}
              placeholder="17:00"
            />

            {/* T368: 실시간 케어 시간 표시 */}
            {pickupTime && dropoffTime && (
              <div className="pt-2">
                <CareTimeDisplay pickupTime={pickupTime} dropoffTime={dropoffTime} />
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-between">
            <div>
              {existingSchedule && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={upsertMutation.isPending}>
                {upsertMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* T369: 경고 다이얼로그 */}
      {careTimeHours !== null && (
        <CareTimeWarning
          isOpen={showWarning}
          onClose={() => {
            setShowWarning(false);
            setPendingSubmit(false);
          }}
          onConfirm={handleConfirmWarning}
          careTimeHours={careTimeHours}
        />
      )}
    </>
  );
}
