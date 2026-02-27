import { z } from 'zod';

/**
 * T361: PassengerSchedule Zod Schema
 * HH:MM 포맷 검증 및 비즈니스 규칙
 */

// HH:MM 시간 포맷 검증 정규식
const TIME_REGEX = /^([0-1]\d|2[0-3]):([0-5]\d)$/;

/**
 * 승객 스케줄 스키마
 */
export const passengerScheduleSchema = z
  .object({
    pickupTime: z
      .string()
      .min(1, 'Pickup time is required')
      .regex(TIME_REGEX, 'Pickup time must be in HH:MM format (00:00-23:59)'),
    dropoffTime: z
      .string()
      .min(1, 'Dropoff time is required')
      .regex(TIME_REGEX, 'Dropoff time must be in HH:MM format (00:00-23:59)'),
  })
  .refine(
    (data) => {
      // pickupTime < dropoffTime 검증
      const [pickupHour, pickupMin] = data.pickupTime.split(':').map(Number);
      const [dropoffHour, dropoffMin] = data.dropoffTime.split(':').map(Number);

      const pickupMinutes = pickupHour * 60 + pickupMin;
      const dropoffMinutes = dropoffHour * 60 + dropoffMin;

      return pickupMinutes < dropoffMinutes;
    },
    {
      message: 'Pickup time must be before dropoff time',
      path: ['dropoffTime'],
    }
  );

export type PassengerScheduleFormData = z.infer<typeof passengerScheduleSchema>;
