import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InstitutionModule } from '../institution/institution.module';
import { PlanController } from './interface/controllers/plan.controller';
import { SubscriptionController } from './interface/controllers/subscription.controller';
import { PlanService } from './application/services/plan.service';
import { SubscriptionService } from './application/services/subscription.service';
import { PlanRepository } from './infrastructure/persistence/plan.repository';
import { SubscriptionRepository } from './infrastructure/persistence/subscription.repository';

/**
 * Phase 11: SubscriptionModule
 *
 * 요금제 & 구독 관리 모듈
 */
@Module({
  imports: [PrismaModule, InstitutionModule],
  controllers: [PlanController, SubscriptionController],
  providers: [
    // Services
    PlanService,
    SubscriptionService,

    // Repositories
    {
      provide: 'IPlanRepository',
      useClass: PlanRepository,
    },
    {
      provide: 'ISubscriptionRepository',
      useClass: SubscriptionRepository,
    },
  ],
  exports: [PlanService, SubscriptionService],
})
export class SubscriptionModule {}
