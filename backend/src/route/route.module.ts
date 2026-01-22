/**
 * Route Module
 * 경로 최적화 및 관리 모듈
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { RouteService } from './application/services/route.service';
import { AdminRouteController } from './interface/controllers/admin-route.controller';
import { RouteRepository } from './infrastructure/persistence/route.repository';
import { VRPSolverService } from './infrastructure/algorithms/vrp-solver.service';
import { ROUTE_REPOSITORY } from './domain/repositories/route.repository.interface';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [AdminRouteController],
  providers: [
    RouteService,
    VRPSolverService,
    {
      provide: ROUTE_REPOSITORY,
      useClass: RouteRepository,
    },
  ],
  exports: [RouteService],
})
export class RouteModule {}
