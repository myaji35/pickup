import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ISubscriptionRepository } from '../../domain/repositories/subscription.repository.interface';
import { Subscription, SubscriptionStatus } from '../../domain/entities/subscription.entity';
import { Subscription as PrismaSubscription } from '@prisma/client';

/**
 * T455: SubscriptionRepository Implementation
 *
 * Phase 11: Prisma를 사용한 Subscription Repository 구현
 */
@Injectable()
export class SubscriptionRepository implements ISubscriptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Subscription | null> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
    });

    return subscription ? this.toDomain(subscription) : null;
  }

  async findActiveByInstitutionId(institutionId: string): Promise<Subscription | null> {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        institutionId,
        status: {
          in: ['ACTIVE', 'TRIAL'],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return subscription ? this.toDomain(subscription) : null;
  }

  async findAllByInstitutionId(institutionId: string): Promise<Subscription[]> {
    const subscriptions = await this.prisma.subscription.findMany({
      where: { institutionId },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return subscriptions.map((sub) => this.toDomain(sub));
  }

  async create(subscription: Subscription): Promise<Subscription> {
    const created = await this.prisma.subscription.create({
      data: {
        id: subscription.id,
        institutionId: subscription.institutionId,
        planId: subscription.planId,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        trialEndsAt: subscription.trialEndsAt,
        autoRenew: subscription.autoRenew,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
      },
    });

    return this.toDomain(created);
  }

  async update(subscription: Subscription): Promise<Subscription> {
    const updated = await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        planId: subscription.planId,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        trialEndsAt: subscription.trialEndsAt,
        autoRenew: subscription.autoRenew,
        updatedAt: subscription.updatedAt,
      },
    });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.subscription.delete({
      where: { id },
    });
  }

  async findExpiredSubscriptions(): Promise<Subscription[]> {
    const now = new Date();

    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        status: {
          in: ['ACTIVE', 'TRIAL'],
        },
        endDate: {
          lte: now,
        },
      },
    });

    return subscriptions.map((sub) => this.toDomain(sub));
  }

  /**
   * Prisma to Domain 매핑
   */
  private toDomain(prismaSubscription: PrismaSubscription): Subscription {
    return new Subscription({
      id: prismaSubscription.id,
      institutionId: prismaSubscription.institutionId,
      planId: prismaSubscription.planId,
      status: prismaSubscription.status as SubscriptionStatus,
      startDate: prismaSubscription.startDate,
      endDate: prismaSubscription.endDate,
      trialEndsAt: prismaSubscription.trialEndsAt,
      autoRenew: prismaSubscription.autoRenew,
      createdAt: prismaSubscription.createdAt,
      updatedAt: prismaSubscription.updatedAt,
    });
  }
}
