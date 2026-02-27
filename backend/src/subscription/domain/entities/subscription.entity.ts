/**
 * T451: Subscription Entity
 *
 * Phase 11: 구독 엔티티
 * - 회원사와 요금제 연결
 * - 구독 상태 관리 (TRIAL, ACTIVE, EXPIRED, CANCELLED)
 * - 구독 기간 관리
 */

export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

export class Subscription {
  readonly id: string;
  institutionId: string;
  planId: string;
  status: SubscriptionStatus;
  startDate: Date;
  endDate: Date | null; // null = 무기한
  trialEndsAt: Date | null; // 체험판 종료일
  autoRenew: boolean;
  readonly createdAt: Date;
  updatedAt: Date;

  constructor(props: {
    id: string;
    institutionId: string;
    planId: string;
    status?: SubscriptionStatus;
    startDate: Date;
    endDate?: Date | null;
    trialEndsAt?: Date | null;
    autoRenew?: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    // Validation
    if (!props.institutionId) {
      throw new Error('institutionId is required');
    }

    if (!props.planId) {
      throw new Error('planId is required');
    }

    this.id = props.id;
    this.institutionId = props.institutionId;
    this.planId = props.planId;
    this.status = props.status || 'TRIAL';
    this.startDate = props.startDate;
    this.endDate = props.endDate || null;
    this.trialEndsAt = props.trialEndsAt || null;
    this.autoRenew = props.autoRenew ?? true;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /**
   * 구독 활성화
   */
  activate(): void {
    if (this.status === 'CANCELLED') {
      throw new Error('Cannot activate cancelled subscription');
    }

    this.status = 'ACTIVE';
    this.updatedAt = new Date();
  }

  /**
   * 구독 취소
   */
  cancel(): void {
    if (this.status === 'CANCELLED') {
      throw new Error('Subscription already cancelled');
    }

    this.status = 'CANCELLED';
    this.autoRenew = false;
    this.updatedAt = new Date();
  }

  /**
   * 구독 만료 처리
   */
  expire(): void {
    this.status = 'EXPIRED';
    this.updatedAt = new Date();
  }

  /**
   * 요금제 변경
   */
  changePlan(newPlanId: string): void {
    if (this.status !== 'ACTIVE' && this.status !== 'TRIAL') {
      throw new Error(`Cannot change plan for subscription with status ${this.status}`);
    }

    this.planId = newPlanId;
    this.updatedAt = new Date();
  }

  /**
   * 구독 기간 연장
   */
  extend(newEndDate: Date): void {
    if (this.status === 'CANCELLED') {
      throw new Error('Cannot extend cancelled subscription');
    }

    if (this.endDate && newEndDate <= this.endDate) {
      throw new Error('New end date must be after current end date');
    }

    this.endDate = newEndDate;
    this.updatedAt = new Date();
  }

  /**
   * 자동 갱신 설정
   */
  setAutoRenew(autoRenew: boolean): void {
    this.autoRenew = autoRenew;
    this.updatedAt = new Date();
  }

  /**
   * 구독 활성 여부 확인
   */
  isActive(): boolean {
    if (this.status !== 'ACTIVE' && this.status !== 'TRIAL') {
      return false;
    }

    // endDate가 없으면 무기한 활성
    if (!this.endDate) {
      return true;
    }

    // endDate가 미래이면 활성
    return this.endDate > new Date();
  }

  /**
   * 체험판 여부 확인
   */
  isTrial(): boolean {
    return this.status === 'TRIAL';
  }

  /**
   * 체험판 만료 여부 확인
   */
  isTrialExpired(): boolean {
    if (!this.trialEndsAt) return false;
    return this.trialEndsAt < new Date();
  }

  /**
   * 구독 만료 예정 여부 확인 (N일 이내)
   */
  isExpiringSoon(daysThreshold: number = 7): boolean {
    if (!this.endDate) return false;

    const daysUntilExpiry = Math.ceil(
      (this.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
    );

    return daysUntilExpiry > 0 && daysUntilExpiry <= daysThreshold;
  }
}
