import { GroupCode } from '../value-objects/group-code.vo';

/**
 * PassengerGroup Domain Entity
 * 승객 그룹 (차량 교체 시에도 유지되는 승객 묶음)
 *
 * 비즈니스 규칙:
 * - 그룹 코드는 기관 내에서 고유해야 함
 * - 승객 수는 음수가 될 수 없음
 * - 승객이 있는 그룹은 삭제 불가
 * - 차량 정원보다 많은 승객을 가질 수 없음
 */
export class PassengerGroup {
  constructor(
    public readonly id: string,
    public readonly institutionId: string,
    public readonly groupCode: GroupCode,
    private _name: string,
    private _totalPassengerCount: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {
    this.validatePassengerCount(_totalPassengerCount);
    this.validateName(_name);
  }

  get name(): string {
    return this._name;
  }

  get totalPassengerCount(): number {
    return this._totalPassengerCount;
  }

  /**
   * 차량 정원이 그룹의 승객을 모두 수용할 수 있는지 확인
   */
  hasCapacityForVehicle(vehicleCapacity: number): boolean {
    return vehicleCapacity >= this._totalPassengerCount;
  }

  /**
   * 승객 수 업데이트 (승객 추가/제거 시)
   */
  updatePassengerCount(count: number): void {
    this.validatePassengerCount(count);
    this._totalPassengerCount = count;
  }

  /**
   * 그룹 이름 변경
   */
  updateName(name: string): void {
    this.validateName(name);
    this._name = name;
  }

  /**
   * 그룹 삭제 가능 여부 (승객이 없어야 함)
   */
  canDelete(): boolean {
    return this._totalPassengerCount === 0;
  }

  private validatePassengerCount(count: number): void {
    if (count < 0) {
      throw new Error('Total passenger count cannot be negative');
    }
  }

  private validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Group name cannot be empty');
    }
  }
}
