import { LicensePlateLastFour } from '../value-objects/license-plate-last-four.vo';
import { PassengerCapacity } from '../value-objects/passenger-capacity.vo';

/**
 * Vehicle Entity
 * 5-15인승 차량 도메인 엔티티
 * 차량은 기관에 속하며, 승객 그룹에 연결될 수 있음
 */
export interface VehicleProps {
  id: string;
  lastFourDigits: LicensePlateLastFour;
  passengerCapacity: PassengerCapacity;
  institutionId: string;
  currentGroupId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Vehicle {
  private readonly _id: string;
  private _lastFourDigits: LicensePlateLastFour;
  private _passengerCapacity: PassengerCapacity;
  private readonly _institutionId: string;
  private _currentGroupId: string | null;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: VehicleProps) {
    this._id = props.id;
    this._lastFourDigits = props.lastFourDigits;
    this._passengerCapacity = props.passengerCapacity;
    this._institutionId = props.institutionId;
    this._currentGroupId = props.currentGroupId;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get lastFourDigits(): LicensePlateLastFour {
    return this._lastFourDigits;
  }

  get passengerCapacity(): PassengerCapacity {
    return this._passengerCapacity;
  }

  get institutionId(): string {
    return this._institutionId;
  }

  get currentGroupId(): string | null {
    return this._currentGroupId;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * 차량을 승객 그룹에 할당
   */
  assignToGroup(groupId: string): void {
    if (!groupId) {
      throw new Error('그룹 ID는 필수입니다');
    }

    this._currentGroupId = groupId;
    this._updatedAt = new Date();
  }

  /**
   * 차량의 그룹 할당 해제
   */
  unassignFromGroup(): void {
    this._currentGroupId = null;
    this._updatedAt = new Date();
  }

  /**
   * 승객 정원 변경
   */
  updateCapacity(capacity: PassengerCapacity): void {
    this._passengerCapacity = capacity;
    this._updatedAt = new Date();
  }

  /**
   * 차량번호 변경 (차량 교체 시나리오)
   */
  updateLastFourDigits(lastFourDigits: LicensePlateLastFour): void {
    this._lastFourDigits = lastFourDigits;
    this._updatedAt = new Date();
  }

  /**
   * 그룹에 할당되어 있는지 확인
   */
  isAssignedToGroup(): boolean {
    return this._currentGroupId !== null;
  }
}
