import { Subscription } from '../entities/subscription.entity';

/**
 * T454: ISubscriptionRepository Interface
 *
 * Phase 11: 구독 Repository 계약
 */
export interface ISubscriptionRepository {
  /**
   * ID로 구독 조회
   */
  findById(id: string): Promise<Subscription | null>;

  /**
   * 회원사의 활성 구독 조회
   */
  findActiveByInstitutionId(institutionId: string): Promise<Subscription | null>;

  /**
   * 회원사의 모든 구독 이력 조회
   */
  findAllByInstitutionId(institutionId: string): Promise<Subscription[]>;

  /**
   * 구독 생성
   */
  create(subscription: Subscription): Promise<Subscription>;

  /**
   * 구독 업데이트
   */
  update(subscription: Subscription): Promise<Subscription>;

  /**
   * 구독 삭제
   */
  delete(id: string): Promise<void>;

  /**
   * 만료된 구독 조회 (배치 작업용)
   */
  findExpiredSubscriptions(): Promise<Subscription[]>;
}
