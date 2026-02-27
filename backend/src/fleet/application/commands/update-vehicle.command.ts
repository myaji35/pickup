/**
 * UpdateVehicleCommand
 * 차량 정보 업데이트 커맨드
 */
export interface UpdateVehicleCommand {
  id: string;
  passengerCapacity?: number;
  currentGroupId?: string | null;
}
