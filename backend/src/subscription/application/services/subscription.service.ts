import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { ISubscriptionRepository } from '../../domain/repositories/subscription.repository.interface';
import { IPlanRepository } from '../../domain/repositories/plan.repository.interface';
import { IInstitutionRepository } from '../../../institution/domain/repositories/institution.repository.interface';
import { Subscription } from '../../domain/entities/subscription.entity';
import { Plan } from '../../domain/entities/plan.entity';

/**
 * T456-T460: SubscriptionService
 *
 * Phase 11: 구독 관리 Application Service
 */
@Injectable()
export class SubscriptionService {
  constructor(
    @Inject('ISubscriptionRepository')
    private readonly subscriptionRepository: ISubscriptionRepository,
    @Inject('IPlanRepository')
    private readonly planRepository: IPlanRepository,
    @Inject('IInstitutionRepository')
    private readonly institutionRepository: IInstitutionRepository,
  ) {}

  /**
   * T457: 구독 생성 (회원사 승인 시 자동 생성)
   */
  async createSubscription(
    institutionId: string,
    planId: string,
    isTrial: boolean = true,
    trialDays: number = 14,
  ): Promise<Subscription> {
    // 회원사 존재 확인
    const institution = await this.institutionRepository.findById(institutionId);
    if (!institution) {
      throw new NotFoundException('Institution not found');
    }

    // 요금제 존재 확인
    const plan = await this.planRepository.findById(planId);
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    // 이미 활성 구독이 있는지 확인
    const existingSubscription = await this.subscriptionRepository.findActiveByInstitutionId(
      institutionId,
    );
    if (existingSubscription) {
      throw new BadRequestException('Institution already has an active subscription');
    }

    const now = new Date();
    const trialEndsAt = isTrial ? new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000) : null;

    const subscription = new Subscription({
      id: '', // Prisma가 생성
      institutionId,
      planId,
      status: isTrial ? 'TRIAL' : 'ACTIVE',
      startDate: now,
      endDate: null, // 무기한
      trialEndsAt,
      autoRenew: true,
      createdAt: now,
      updatedAt: now,
    });

    return this.subscriptionRepository.create(subscription);
  }

  /**
   * T458: 구독 업그레이드 (요금제 변경)
   */
  async upgradeSubscription(institutionId: string, newPlanId: string): Promise<Subscription> {
    // 현재 활성 구독 조회
    const subscription = await this.subscriptionRepository.findActiveByInstitutionId(institutionId);
    if (!subscription) {
      throw new NotFoundException('No active subscription found for this institution');
    }

    // 새 요금제 존재 확인
    const newPlan = await this.planRepository.findById(newPlanId);
    if (!newPlan) {
      throw new NotFoundException('Plan not found');
    }

    // 체험판이면 ACTIVE로 전환
    if (subscription.isTrial()) {
      subscription.activate();
    }

    // 요금제 변경
    subscription.changePlan(newPlanId);

    return this.subscriptionRepository.update(subscription);
  }

  /**
   * T459: 구독 취소
   */
  async cancelSubscription(institutionId: string): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findActiveByInstitutionId(institutionId);
    if (!subscription) {
      throw new NotFoundException('No active subscription found for this institution');
    }

    subscription.cancel();

    return this.subscriptionRepository.update(subscription);
  }

  /**
   * T460: 구독 한도 체크 (차량 수, 승객 수)
   */
  async checkSubscriptionLimits(
    institutionId: string,
    currentVehicleCount: number,
    currentPassengerCount: number,
  ): Promise<{
    canAddVehicle: boolean;
    canAddPassenger: boolean;
    plan: Plan;
    subscription: Subscription;
  }> {
    // 활성 구독 조회
    const subscription = await this.subscriptionRepository.findActiveByInstitutionId(institutionId);
    if (!subscription) {
      throw new NotFoundException('No active subscription found for this institution');
    }

    // 요금제 조회
    const plan = await this.planRepository.findById(subscription.planId);
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    return {
      canAddVehicle: plan.canAddVehicle(currentVehicleCount),
      canAddPassenger: plan.canAddPassenger(currentPassengerCount),
      plan,
      subscription,
    };
  }

  /**
   * 회원사의 활성 구독 조회
   */
  async getActiveSubscription(institutionId: string): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findActiveByInstitutionId(institutionId);

    if (!subscription) {
      throw new NotFoundException('No active subscription found for this institution');
    }

    return subscription;
  }

  /**
   * 회원사의 구독 이력 조회
   */
  async getSubscriptionHistory(institutionId: string): Promise<Subscription[]> {
    return this.subscriptionRepository.findAllByInstitutionId(institutionId);
  }

  /**
   * 만료된 구독 처리 (배치 작업용)
   */
  async processExpiredSubscriptions(): Promise<number> {
    const expiredSubscriptions = await this.subscriptionRepository.findExpiredSubscriptions();

    for (const subscription of expiredSubscriptions) {
      subscription.expire();
      await this.subscriptionRepository.update(subscription);
    }

    return expiredSubscriptions.length;
  }

  /**
   * 전체 구독 목록 조회 (Admin용)
   */
  async getAllSubscriptions(status?: string): Promise<Subscription[]> {
    return this.subscriptionRepository.findAll(status);
  }

  /**
   * 구독 ID로 조회 (Admin용)
   */
  async getSubscriptionById(id: string): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findById(id);
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }
    return subscription;
  }
}
