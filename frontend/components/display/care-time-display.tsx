'use client';

import { Clock } from 'lucide-react';

/**
 * T365: CareTimeDisplay Component
 * 계산된 케어 시간을 표시하는 컴포넌트
 */

interface CareTimeDisplayProps {
  pickupTime: string;
  dropoffTime: string;
}

function calculateCareTimeHours(pickupTime: string, dropoffTime: string): number | null {
  // HH:MM 포맷 검증
  const timeRegex = /^([0-1]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(pickupTime) || !timeRegex.test(dropoffTime)) {
    return null;
  }

  const [pickupHour, pickupMin] = pickupTime.split(':').map(Number);
  const [dropoffHour, dropoffMin] = dropoffTime.split(':').map(Number);

  const pickupMinutes = pickupHour * 60 + pickupMin;
  const dropoffMinutes = dropoffHour * 60 + dropoffMin;

  if (pickupMinutes >= dropoffMinutes) {
    return null;
  }

  const diffMinutes = dropoffMinutes - pickupMinutes;
  const hours = diffMinutes / 60;

  return hours;
}

export function CareTimeDisplay({ pickupTime, dropoffTime }: CareTimeDisplayProps) {
  const careTimeHours = calculateCareTimeHours(pickupTime, dropoffTime);

  if (careTimeHours === null) {
    return null;
  }

  const isSufficient = careTimeHours >= 8;
  const colorClass = isSufficient ? 'text-green-600' : 'text-amber-600';

  return (
    <div className={`flex items-center gap-2 text-sm ${colorClass}`}>
      <Clock className="h-4 w-4" />
      <span className="font-medium">
        Care Time: {careTimeHours.toFixed(1)} hours
      </span>
      {!isSufficient && (
        <span className="text-xs text-amber-600">
          (Less than 8 hours)
        </span>
      )}
    </div>
  );
}
