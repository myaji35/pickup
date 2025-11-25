/**
 * Trip Module (Phase 12)
 *
 * 운행 관리 모듈
 */

import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TripRepository } from './infrastructure/persistence/trip.repository';
import { CheckInRepository } from './infrastructure/persistence/checkin.repository';
import { TripService } from './application/services/trip.service';
import { CheckInService } from './application/services/checkin.service';
import { DriverController } from './interface/controllers/driver.controller';
import { TRIP_REPOSITORY } from './domain/repositories/trip.repository.interface';
import { CHECKIN_REPOSITORY } from './domain/repositories/checkin.repository.interface';

@Module({
  imports: [PrismaModule],
  controllers: [DriverController],
  providers: [
    // Services
    TripService,
    CheckInService,
    // Repositories
    {
      provide: TRIP_REPOSITORY,
      useClass: TripRepository,
    },
    {
      provide: CHECKIN_REPOSITORY,
      useClass: CheckInRepository,
    },
  ],
  exports: [TripService, CheckInService],
})
export class TripModule {}
