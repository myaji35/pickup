import { PassengerSchedule } from './passenger-schedule';

/**
 * Passenger Type
 * 승객 타입 정의
 */
export interface Passenger {
  id: string;
  institutionId: string;
  name: string;
  phoneNumber: string;
  pickupAddress: string;
  dropoffAddress: string;
  shuttleType: 'MORNING' | 'EVENING' | 'TEMPORARY';
  groupId: string | null;
  schedule?: PassengerSchedule | null; // T372: 스케줄 정보 (Optional)
  createdAt: string;
  updatedAt: string;
}

export interface CreatePassengerRequest {
  institutionId: string;
  name: string;
  phoneNumber: string;
  pickupAddress: string;
  dropoffAddress: string;
  shuttleType: 'MORNING' | 'EVENING' | 'TEMPORARY';
  groupId?: string | null;
}

export interface UpdatePassengerRequest {
  name?: string;
  phoneNumber?: string;
  groupId?: string | null;
}
