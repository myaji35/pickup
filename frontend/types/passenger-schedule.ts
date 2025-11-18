/**
 * T360: PassengerSchedule Type
 * 승객 스케줄 타입 정의
 */
export interface PassengerSchedule {
  id: string;
  passengerId: string;
  pickupTime: string; // HH:MM format
  dropoffTime: string; // HH:MM format
  careTimeHours: number;
  isCareTimeInsufficient: boolean;
  warning?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 스케줄 생성/수정 요청 타입
 */
export interface UpsertPassengerScheduleRequest {
  pickupTime: string; // HH:MM format
  dropoffTime: string; // HH:MM format
}
