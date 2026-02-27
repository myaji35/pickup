import { PhoneNumber } from '../value-objects/phone-number.vo';
import { Address } from '../value-objects/address.vo';

/**
 * ShuttleType
 * MORNING: 아침 등원 (여러 곳 픽업 → 기관)
 * EVENING: 저녁 하원 (기관 → 여러 곳 드랍오프)
 * TEMPORARY: 임시/on-demand 픽업/배달
 */
export type ShuttleType = 'MORNING' | 'EVENING' | 'TEMPORARY';

/**
 * Passenger Domain Entity
 * 승객 정보 (연락처 기반 식별)
 *
 * 비즈니스 규칙:
 * - 전화번호는 기관 내에서 고유해야 함
 * - 픽업/드랍오프 주소는 서로 달라야 함
 * - 그룹에 배정될 수 있음 (선택)
 */
export class Passenger {
  constructor(
    public readonly id: string,
    public readonly institutionId: string,
    private _name: string,
    private _phoneNumber: PhoneNumber,
    public readonly pickupAddress: Address,
    public readonly dropoffAddress: Address,
    public readonly shuttleType: ShuttleType,
    private _groupId: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {
    this.validateName(_name);
    this.validateAddresses(pickupAddress, dropoffAddress);
  }

  get name(): string {
    return this._name;
  }

  get phoneNumber(): PhoneNumber {
    return this._phoneNumber;
  }

  get groupId(): string | null {
    return this._groupId;
  }

  /**
   * 승객 이름 변경
   */
  updateName(name: string): void {
    this.validateName(name);
    this._name = name;
  }

  /**
   * 전화번호 변경
   */
  updatePhoneNumber(phoneNumber: PhoneNumber): void {
    this._phoneNumber = phoneNumber;
  }

  /**
   * 그룹에 배정
   */
  assignToGroup(groupId: string): void {
    this._groupId = groupId;
  }

  /**
   * 그룹에서 제거
   */
  removeFromGroup(): void {
    this._groupId = null;
  }

  /**
   * 그룹 배정 여부 확인
   */
  isAssignedToGroup(): boolean {
    return this._groupId !== null;
  }

  private validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Passenger name cannot be empty');
    }
  }

  private validateAddresses(pickup: Address, dropoff: Address): void {
    if (pickup.equals(dropoff)) {
      throw new Error('Pickup and dropoff addresses must be different');
    }
  }
}
