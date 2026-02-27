import { z } from 'zod';

/**
 * Passenger Group Validation Schema
 * Zod를 사용한 클라이언트 측 검증
 */
export const passengerGroupSchema = z.object({
  groupCode: z
    .string()
    .min(1, 'Group code is required')
    .max(20, 'Group code must be 20 characters or less')
    .regex(/^[A-Za-z0-9_-]+$/, 'Group code can only contain letters, numbers, hyphens, and underscores'),
  name: z
    .string()
    .min(1, 'Group name is required')
    .max(100, 'Group name must be 100 characters or less'),
  institutionId: z.string().min(1, 'Institution ID is required'),
  passengerIds: z.array(z.string()).optional(),
});

export type PassengerGroupFormData = z.infer<typeof passengerGroupSchema>;
