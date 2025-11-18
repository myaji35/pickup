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
