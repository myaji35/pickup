/**
 * T247: DisconnectVehicleFromGroupCommand
 * 차량의 그룹 연결을 해제하는 Command
 *
 * 비즈니스 규칙:
 * - 그룹과 승객은 유지됨 (차량만 해제)
 * - 이미 연결되지 않은 차량에 대해 호출 시 idempotent (멱등성)
 */
export class DisconnectVehicleFromGroupCommand {
  constructor(public readonly vehicleId: string) {}
}
