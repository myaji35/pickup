/**
 * CreateVehicleCommand
 * 차량 생성 커맨드
 */
export interface CreateVehicleCommand {
  lastFourDigits: string;
  passengerCapacity: number;
  institutionId: string;
  currentGroupId?: string;
}
