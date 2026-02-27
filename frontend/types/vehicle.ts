/**
 * Vehicle Type Definitions
 * 차량 관련 타입 정의
 */

export interface Vehicle {
  id: string;
  lastFourDigits: string;
  passengerCapacity: number;
  institutionId: string;
  currentGroupId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVehicleInput {
  lastFourDigits: string;
  passengerCapacity: number;
  institutionId: string;
  currentGroupId?: string;
}

export interface UpdateVehicleInput {
  passengerCapacity?: number;
  currentGroupId?: string | null;
}
