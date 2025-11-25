import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SubscriptionService } from './subscription.service';
import { ISubscriptionRepository } from '../../domain/repositories/subscription.repository.interface';
import { InstitutionService } from '../../../institution/application/services/institution.service';
import { PlanService } from './plan.service';
import { Subscription } from '../../domain/entities/subscription.entity';
import { Plan } from '../../domain/entities/plan.entity';

/**
 * T498: SubscriptionService Unit Tests
 *
 * 구독 관리 핵심 비즈니스 로직 검증:
 * - 구독 생성 (트라이얼)
 * - 구독 활성화
 * - 구독 취소
 * - 요금제 변경
 */
describe('SubscriptionService', () => {
  let subscriptionService: SubscriptionService;
  let subscriptionRepository: ISubscriptionRepository;
  let institutionService: InstitutionService;
  let planService: PlanService;

  beforeEach(() => {
    // Mock dependencies
    subscriptionRepository = {
      findById: vi.fn(),
      findByInstitutionId: vi.fn(),
      findActiveByInstitutionId: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as any;

    institutionService = {
      getInstitutionById: vi.fn(),
    } as any;

    planService = {
      getPlanById: vi.fn(),
    } as any;

    subscriptionService = new SubscriptionService(
      subscriptionRepository,
      institutionService,
      planService,
    );
  });

  describe('createSubscription', () => {
    it('should create a trial subscription', async () => {
      // Arrange
      const mockInstitution = { id: 'inst-1', name: '테스트 기관' };
      const mockPlan = new Plan(
        'plan-1',
        '스타터',
        'STARTER',
        3,
        30,
        50000,
        { csvUpload: true },
        true,
        new Date(),
        new Date(),
      );

      const mockSubscription = new Subscription(
        'sub-1',
        'inst-1',
        'plan-1',
        'TRIAL' as any,
        new Date(),
        null,
        new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
        true,
        new Date(),
        new Date(),
      );

      vi.spyOn(institutionService, 'getInstitutionById').mockResolvedValue(mockInstitution as any);
      vi.spyOn(planService, 'getPlanById').mockResolvedValue(mockPlan);
      vi.spyOn(subscriptionRepository, 'findActiveByInstitutionId').mockResolvedValue(null);
      vi.spyOn(subscriptionRepository, 'create').mockResolvedValue(mockSubscription);

      // Act
      const result = await subscriptionService.createSubscription('inst-1', 'plan-1');

      // Assert
      expect(result.status).toBe('TRIAL');
      expect(result.institutionId).toBe('inst-1');
      expect(result.planId).toBe('plan-1');
      expect(result.trialEndsAt).toBeDefined();
      expect(subscriptionRepository.create).toHaveBeenCalled();
    });

    it('should throw error if institution already has active subscription', async () => {
      // Arrange
      const existingSubscription = new Subscription(
        'sub-1',
        'inst-1',
        'plan-old',
        'ACTIVE' as any,
        new Date(),
        null,
        null,
        true,
        new Date(),
        new Date(),
      );

      vi.spyOn(institutionService, 'getInstitutionById').mockResolvedValue({} as any);
      vi.spyOn(planService, 'getPlanById').mockResolvedValue({} as any);
      vi.spyOn(subscriptionRepository, 'findActiveByInstitutionId').mockResolvedValue(
        existingSubscription,
      );

      // Act & Assert
      await expect(
        subscriptionService.createSubscription('inst-1', 'plan-1'),
      ).rejects.toThrow('Institution already has an active subscription');
    });
  });

  describe('activateSubscription', () => {
    it('should activate a trial subscription', async () => {
      // Arrange
      const mockSubscription = new Subscription(
        'sub-1',
        'inst-1',
        'plan-1',
        'TRIAL' as any,
        new Date(),
        null,
        new Date(),
        true,
        new Date(),
        new Date(),
      );

      vi.spyOn(subscriptionRepository, 'findById').mockResolvedValue(mockSubscription);
      vi.spyOn(subscriptionRepository, 'update').mockResolvedValue(mockSubscription);

      // Act
      const result = await subscriptionService.activateSubscription('sub-1');

      // Assert
      expect(result.status).toBe('ACTIVE');
      expect(result.trialEndsAt).toBeNull();
      expect(subscriptionRepository.update).toHaveBeenCalledWith(mockSubscription);
    });

    it('should throw error when subscription not found', async () => {
      // Arrange
      vi.spyOn(subscriptionRepository, 'findById').mockResolvedValue(null);

      // Act & Assert
      await expect(subscriptionService.activateSubscription('nonexistent')).rejects.toThrow(
        'Subscription not found',
      );
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel an active subscription', async () => {
      // Arrange
      const mockSubscription = new Subscription(
        'sub-1',
        'inst-1',
        'plan-1',
        'ACTIVE' as any,
        new Date(),
        null,
        null,
        true,
        new Date(),
        new Date(),
      );

      vi.spyOn(subscriptionRepository, 'findById').mockResolvedValue(mockSubscription);
      vi.spyOn(subscriptionRepository, 'update').mockResolvedValue(mockSubscription);

      // Act
      const result = await subscriptionService.cancelSubscription('sub-1');

      // Assert
      expect(result.status).toBe('CANCELLED');
      expect(result.autoRenew).toBe(false);
      expect(subscriptionRepository.update).toHaveBeenCalledWith(mockSubscription);
    });
  });

  describe('changePlan', () => {
    it('should change subscription plan', async () => {
      // Arrange
      const mockSubscription = new Subscription(
        'sub-1',
        'inst-1',
        'plan-old',
        'ACTIVE' as any,
        new Date(),
        null,
        null,
        true,
        new Date(),
        new Date(),
      );

      const newPlan = new Plan(
        'plan-new',
        '프로',
        'PRO',
        10,
        100,
        150000,
        { csvUpload: true, analytics: true },
        true,
        new Date(),
        new Date(),
      );

      vi.spyOn(subscriptionRepository, 'findById').mockResolvedValue(mockSubscription);
      vi.spyOn(planService, 'getPlanById').mockResolvedValue(newPlan);
      vi.spyOn(subscriptionRepository, 'update').mockResolvedValue(mockSubscription);

      // Act
      const result = await subscriptionService.changePlan('sub-1', 'plan-new');

      // Assert
      expect(result.planId).toBe('plan-new');
      expect(subscriptionRepository.update).toHaveBeenCalledWith(mockSubscription);
    });

    it('should throw error when new plan not found', async () => {
      // Arrange
      const mockSubscription = new Subscription(
        'sub-1',
        'inst-1',
        'plan-old',
        'ACTIVE' as any,
        new Date(),
        null,
        null,
        true,
        new Date(),
        new Date(),
      );

      vi.spyOn(subscriptionRepository, 'findById').mockResolvedValue(mockSubscription);
      vi.spyOn(planService, 'getPlanById').mockResolvedValue(null);

      // Act & Assert
      await expect(subscriptionService.changePlan('sub-1', 'nonexistent')).rejects.toThrow(
        'Plan not found',
      );
    });
  });

  describe('isActive', () => {
    it('should return true for ACTIVE subscription without end date', () => {
      // Arrange
      const subscription = new Subscription(
        'sub-1',
        'inst-1',
        'plan-1',
        'ACTIVE' as any,
        new Date(),
        null,
        null,
        true,
        new Date(),
        new Date(),
      );

      // Act
      const result = subscription.isActive();

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for EXPIRED subscription', () => {
      // Arrange
      const subscription = new Subscription(
        'sub-1',
        'inst-1',
        'plan-1',
        'EXPIRED' as any,
        new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
        new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        null,
        true,
        new Date(),
        new Date(),
      );

      // Act
      const result = subscription.isActive();

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for CANCELLED subscription', () => {
      // Arrange
      const subscription = new Subscription(
        'sub-1',
        'inst-1',
        'plan-1',
        'CANCELLED' as any,
        new Date(),
        null,
        null,
        false,
        new Date(),
        new Date(),
      );

      // Act
      const result = subscription.isActive();

      // Assert
      expect(result).toBe(false);
    });
  });
});
