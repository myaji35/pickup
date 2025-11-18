import { Module } from '@nestjs/common';
import { VehicleController } from './interface/controllers/vehicle.controller';
import { VehicleService } from './application/services/vehicle.service';
import { VehicleRepository } from './infrastructure/persistence/vehicle.repository';
import { IVehicleRepository } from './domain/repositories/vehicle.repository.interface';

/**
 * Fleet Context Module
 * 차량 관리 및 그룹 연결
 * - Vehicle: 5-15인승 차량 정보
 * - currentGroup: 차량-그룹 연결 관리
 */
@Module({
  controllers: [VehicleController],
  providers: [
    VehicleService,
    {
      provide: 'IVehicleRepository',
      useClass: VehicleRepository,
    },
    // Alias for dependency injection
    {
      provide: IVehicleRepository,
      useClass: VehicleRepository,
    },
  ],
  exports: [VehicleService],
})
export class FleetModule {}
