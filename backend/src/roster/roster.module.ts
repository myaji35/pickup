import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PassengerGroupController } from './interface/controllers/passenger-group.controller';
import { PassengerController } from './interface/controllers/passenger.controller';
import { PassengerGroupService } from './application/services/passenger-group.service';
import { PassengerService } from './application/services/passenger.service';
import { PassengerGroupRepository } from './infrastructure/persistence/passenger-group.repository';
import { PassengerRepository } from './infrastructure/persistence/passenger.repository';

/**
 * Roster Context Module
 * 승객 및 그룹 관리, 8시간 케어 검증
 * - PassengerGroup: 승객 그룹 (차량 교체 시 지속성)
 * - Passenger: 승객 정보 (연락처 기반 식별)
 * - PassengerSchedule: 8시간 케어 시간 검증 (주간보호 시설)
 */
@Module({
  imports: [PrismaModule],
  controllers: [PassengerGroupController, PassengerController],
  providers: [
    // PassengerGroup
    PassengerGroupService,
    {
      provide: 'IPassengerGroupRepository',
      useClass: PassengerGroupRepository,
    },
    PassengerGroupRepository,
    // Passenger
    PassengerService,
    {
      provide: 'IPassengerRepository',
      useClass: PassengerRepository,
    },
    PassengerRepository,
  ],
  exports: [PassengerGroupService, PassengerService],
})
export class RosterModule {}
