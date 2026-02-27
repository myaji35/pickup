/**
 * T446: Plan Entity
 *
 * Phase 11: 요금제 엔티티
 * - SaaS 가격 티어 관리
 * - 차량/승객 수 제한
 * - 기능 플래그 (JSON)
 */

export interface PlanFeatures {
  csvUpload?: boolean;
  analytics?: boolean;
  aiOptimization?: boolean;
  apiAccess?: boolean;
  prioritySupport?: boolean;
  [key: string]: boolean | undefined;
}

export class Plan {
  readonly id: string;
  name: string;
  code: string;
  maxVehicles: number | null; // null = unlimited
  maxPassengers: number | null; // null = unlimited
  monthlyPrice: number; // 월 요금 (원)
  features: PlanFeatures; // 추가 기능 플래그
  isActive: boolean;
  readonly createdAt: Date;
  updatedAt: Date;

  constructor(props: {
    id: string;
    name: string;
    code: string;
    maxVehicles: number | null;
    maxPassengers: number | null;
    monthlyPrice: number;
    features: PlanFeatures;
    isActive?: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    // Validation
    if (!props.name || props.name.trim() === '') {
      throw new Error('Plan name cannot be empty');
    }

    if (!props.code || props.code.trim() === '') {
      throw new Error('Plan code cannot be empty');
    }

    if (props.monthlyPrice < 0) {
      throw new Error('Monthly price cannot be negative');
    }

    this.id = props.id;
    this.name = props.name;
    this.code = props.code;
    this.maxVehicles = props.maxVehicles;
    this.maxPassengers = props.maxPassengers;
    this.monthlyPrice = props.monthlyPrice;
    this.features = props.features;
    this.isActive = props.isActive ?? true;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /**
   * 요금제 이름 업데이트
   */
  updateName(name: string): void {
    if (!name || name.trim() === '') {
      throw new Error('Plan name cannot be empty');
    }

    this.name = name;
    this.updatedAt = new Date();
  }

  /**
   * 요금제 가격 업데이트
   */
  updatePrice(monthlyPrice: number): void {
    if (monthlyPrice < 0) {
      throw new Error('Monthly price cannot be negative');
    }

    this.monthlyPrice = monthlyPrice;
    this.updatedAt = new Date();
  }

  /**
   * 요금제 제한 업데이트
   */
  updateLimits(maxVehicles: number | null, maxPassengers: number | null): void {
    this.maxVehicles = maxVehicles;
    this.maxPassengers = maxPassengers;
    this.updatedAt = new Date();
  }

  /**
   * 요금제 기능 업데이트
   */
  updateFeatures(features: PlanFeatures): void {
    this.features = features;
    this.updatedAt = new Date();
  }

  /**
   * 요금제 활성화/비활성화
   */
  setActive(isActive: boolean): void {
    this.isActive = isActive;
    this.updatedAt = new Date();
  }

  /**
   * 특정 기능 사용 가능 여부 확인
   */
  hasFeature(featureName: string): boolean {
    return this.features[featureName] === true;
  }

  /**
   * 차량 수 제한 확인
   */
  canAddVehicle(currentVehicleCount: number): boolean {
    if (this.maxVehicles === null) return true; // unlimited
    return currentVehicleCount < this.maxVehicles;
  }

  /**
   * 승객 수 제한 확인
   */
  canAddPassenger(currentPassengerCount: number): boolean {
    if (this.maxPassengers === null) return true; // unlimited
    return currentPassengerCount < this.maxPassengers;
  }
}
