import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { IPlanRepository } from '../../domain/repositories/plan.repository.interface';
import { Plan } from '../../domain/entities/plan.entity';

/**
 * Phase 11: PlanService
 *
 * 요금제 관리 Application Service
 */
@Injectable()
export class PlanService {
  constructor(
    @Inject('IPlanRepository')
    private readonly planRepository: IPlanRepository,
  ) {}

  /**
   * ID로 요금제 조회
   */
  async getPlanById(id: string): Promise<Plan> {
    const plan = await this.planRepository.findById(id);

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    return plan;
  }

  /**
   * 코드로 요금제 조회
   */
  async getPlanByCode(code: string): Promise<Plan> {
    const plan = await this.planRepository.findByCode(code);

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    return plan;
  }

  /**
   * 모든 요금제 조회 (활성 요금제만 또는 전체)
   */
  async getAllPlans(isActiveOnly: boolean = true): Promise<Plan[]> {
    return this.planRepository.findAll(isActiveOnly);
  }

  /**
   * 요금제 생성
   */
  async createPlan(
    name: string,
    code: string,
    maxVehicles: number | null,
    maxPassengers: number | null,
    monthlyPrice: number,
    features: any,
  ): Promise<Plan> {
    // 코드 중복 확인
    const existing = await this.planRepository.findByCode(code);
    if (existing) {
      throw new ConflictException('Plan code already exists');
    }

    const plan = new Plan({
      id: '', // Prisma가 생성
      name,
      code,
      maxVehicles,
      maxPassengers,
      monthlyPrice,
      features,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return this.planRepository.create(plan);
  }

  /**
   * 요금제 업데이트
   */
  async updatePlan(
    id: string,
    updates: {
      name?: string;
      monthlyPrice?: number;
      maxVehicles?: number | null;
      maxPassengers?: number | null;
      features?: any;
    },
  ): Promise<Plan> {
    const plan = await this.getPlanById(id);

    if (updates.name !== undefined) {
      plan.updateName(updates.name);
    }

    if (updates.monthlyPrice !== undefined) {
      plan.updatePrice(updates.monthlyPrice);
    }

    if (updates.maxVehicles !== undefined || updates.maxPassengers !== undefined) {
      plan.updateLimits(
        updates.maxVehicles !== undefined ? updates.maxVehicles : plan.maxVehicles,
        updates.maxPassengers !== undefined ? updates.maxPassengers : plan.maxPassengers,
      );
    }

    if (updates.features !== undefined) {
      plan.updateFeatures(updates.features);
    }

    return this.planRepository.update(plan);
  }

  /**
   * 요금제 비활성화 (Soft Delete)
   */
  async deactivatePlan(id: string): Promise<void> {
    const plan = await this.getPlanById(id);
    plan.setActive(false);
    await this.planRepository.update(plan);
  }
}
