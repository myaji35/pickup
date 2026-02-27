import { z } from 'zod';

/**
 * Vehicle Zod Schemas
 * 차량 관련 검증 스키마
 */

export const vehicleSchema = z.object({
  id: z.string().uuid(),
  lastFourDigits: z
    .string()
    .regex(/^\d{4}$/, '차량번호는 4자리 숫자여야 합니다'),
  passengerCapacity: z
    .number()
    .int('승객 정원은 정수여야 합니다')
    .min(5, '승객 정원은 최소 5명이어야 합니다')
    .max(15, '승객 정원은 최대 15명이어야 합니다'),
  institutionId: z.string().uuid(),
  currentGroupId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createVehicleSchema = z.object({
  lastFourDigits: z
    .string()
    .regex(/^\d{4}$/, '차량번호는 4자리 숫자여야 합니다')
    .min(4, '차량번호는 4자리여야 합니다')
    .max(4, '차량번호는 4자리여야 합니다'),
  passengerCapacity: z
    .number()
    .int('승객 정원은 정수여야 합니다')
    .min(5, '승객 정원은 최소 5명이어야 합니다')
    .max(15, '승객 정원은 최대 15명이어야 합니다'),
  institutionId: z.string().uuid('올바른 기관 ID가 아닙니다'),
  currentGroupId: z.string().uuid().optional(),
});

export const updateVehicleSchema = z.object({
  passengerCapacity: z
    .number()
    .int('승객 정원은 정수여야 합니다')
    .min(5, '승객 정원은 최소 5명이어야 합니다')
    .max(15, '승객 정원은 최대 15명이어야 합니다')
    .optional(),
  currentGroupId: z.string().uuid().nullable().optional(),
});

export type VehicleFormData = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleFormData = z.infer<typeof updateVehicleSchema>;
