/**
 * T246: ConnectVehicleToGroupCommand
 * 차량을 승객 그룹에 연결하는 Command
 *
 * 비즈니스 규칙:
 * - 차량 정원 >= 그룹 승객 수 (용량 검증 필수)
 * - 이미 다른 그룹에 연결된 차량은 새 그룹으로 재연결 가능
 */
export class ConnectVehicleToGroupCommand {
  constructor(
    public readonly vehicleId: string,
    public readonly groupId: string,
  ) {}
}
