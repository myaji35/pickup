import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { IPlanRepository } from '../../domain/repositories/plan.repository.interface';
import { Plan, PlanFeatures } from '../../domain/entities/plan.entity';
import { Plan as PrismaPlan } from '@prisma/client';

/**
 * T448: PlanRepository Implementation
 *
 * Phase 11: Prisma를 사용한 Plan Repository 구현
 */
@Injectable()
export class PlanRepository implements IPlanRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Plan | null> {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
    });

    return plan ? this.toDomain(plan) : null;
  }

  async findByCode(code: string): Promise<Plan | null> {
    const plan = await this.prisma.plan.findUnique({
      where: { code },
    });

    return plan ? this.toDomain(plan) : null;
  }

  async findAll(isActiveOnly: boolean = false): Promise<Plan[]> {
    const plans = await this.prisma.plan.findMany({
      where: isActiveOnly ? { isActive: true } : undefined,
      orderBy: {
        monthlyPrice: 'asc', // 가격 낮은 순
      },
    });

    return plans.map((plan) => this.toDomain(plan));
  }

  async create(plan: Plan): Promise<Plan> {
    const created = await this.prisma.plan.create({
      data: {
        id: plan.id,
        name: plan.name,
        code: plan.code,
        maxVehicles: plan.maxVehicles,
        maxPassengers: plan.maxPassengers,
        monthlyPrice: plan.monthlyPrice,
        features: plan.features as any,
        isActive: plan.isActive,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
      },
    });

    return this.toDomain(created);
  }

  async update(plan: Plan): Promise<Plan> {
    const updated = await this.prisma.plan.update({
      where: { id: plan.id },
      data: {
        name: plan.name,
        code: plan.code,
        maxVehicles: plan.maxVehicles,
        maxPassengers: plan.maxPassengers,
        monthlyPrice: plan.monthlyPrice,
        features: plan.features as any,
        isActive: plan.isActive,
        updatedAt: plan.updatedAt,
      },
    });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    // Soft Delete: isActive = false로 변경
    await this.prisma.plan.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Prisma to Domain 매핑
   */
  private toDomain(prismaPlan: PrismaPlan): Plan {
    return new Plan({
      id: prismaPlan.id,
      name: prismaPlan.name,
      code: prismaPlan.code,
      maxVehicles: prismaPlan.maxVehicles,
      maxPassengers: prismaPlan.maxPassengers,
      monthlyPrice: prismaPlan.monthlyPrice,
      features: prismaPlan.features as PlanFeatures,
      isActive: prismaPlan.isActive,
      createdAt: prismaPlan.createdAt,
      updatedAt: prismaPlan.updatedAt,
    });
  }
}
