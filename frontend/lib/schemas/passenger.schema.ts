import { z } from 'zod';

export const passengerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  phoneNumber: z
    .string()
    .min(1, 'Phone number is required')
    .regex(/^01[016789]-?\d{3,4}-?\d{4}$/, 'Invalid Korean phone number format'),
  pickupAddress: z.string().min(1, 'Pickup address is required').max(200, 'Address must be 200 characters or less'),
  dropoffAddress: z.string().min(1, 'Dropoff address is required').max(200, 'Address must be 200 characters or less'),
  shuttleType: z.enum(['MORNING', 'EVENING', 'TEMPORARY']),
  institutionId: z.string().min(1, 'Institution ID is required'),
  groupId: z.string().optional().nullable(),
});

export type PassengerFormData = z.infer<typeof passengerSchema>;
