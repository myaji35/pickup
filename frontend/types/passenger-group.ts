/**
 * PassengerGroup Type
 * 승객 그룹 타입 정의
 */
export interface PassengerGroup {
  id: string;
  institutionId: string;
  groupCode: string;
  name: string;
  totalPassengerCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create Passenger Group Request
 */
export interface CreatePassengerGroupRequest {
  institutionId: string;
  groupCode: string;
  name: string;
  passengerIds?: string[];
}

/**
 * Update Passenger Group Request
 */
export interface UpdatePassengerGroupRequest {
  name?: string;
}
