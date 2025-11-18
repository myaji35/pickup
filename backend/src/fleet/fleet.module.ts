import { Module } from '@nestjs/common';
import { VehicleController } from './interface/controllers/vehicle.controller';
import { VehicleService } from './application/services/vehicle.service';
import { VehicleRepository } from './infrastructure/persistence/vehicle.repository';
import { IVehicleRepository } from './domain/repositories/vehicle.repository.interface';
import { RosterModule } from '../roster/roster.module';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Fleet Context Module
 * 차량 관리 및 그룹 연결
 * - Vehicle: 5-15인승 차량 정보
 * - currentGroup: 차량-그룹 연결 관리
 *
 * Dependencies:
 * - RosterModule: PassengerGroupService (용량 검증을 위한 그룹 조회)
 */
@Module({
  imports: [PrismaModule, RosterModule],
  controllers: [VehicleController],
  providers: [
    VehicleService,
    {
      provide: 'IVehicleRepository',
      useClass: VehicleRepository,
    },
    VehicleRepository,
  ],
  exports: [VehicleService],
})
export class FleetModule {}
