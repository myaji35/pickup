import { Injectable, ConflictException, NotFoundException, Inject } from '@nestjs/common';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { Vehicle } from '../../domain/entities/vehicle.entity';
import { LicensePlateLastFour } from '../../domain/value-objects/license-plate-last-four.vo';
import { PassengerCapacity } from '../../domain/value-objects/passenger-capacity.vo';
import { CreateVehicleCommand } from '../commands/create-vehicle.command';
import { UpdateVehicleCommand } from '../commands/update-vehicle.command';
import { randomUUID } from 'crypto';

/**
 * VehicleService
 * 차량 관리 비즈니스 로직
 */
@Injectable()
export class VehicleService {
  constructor(
    @Inject('IVehicleRepository')
    private readonly vehicleRepository: IVehicleRepository,
  ) {}

  /**
   * T075: 새 차량 생성
   */
  async createVehicle(command: CreateVehicleCommand): Promise<Vehicle> {
    // 중복 검증: 동일 기관 내 차량번호 뒤 4자리 중복 확인
    const existing = await this.vehicleRepository.findByLastFourDigits(
      command.institutionId,
      command.lastFourDigits,
    );

    if (existing) {
      throw new ConflictException('해당 기관에 이미 동일한 차량번호 뒤 4자리가 존재합니다');
    }

    // Value Objects 생성
    const lastFourDigits = new LicensePlateLastFour(command.lastFourDigits);
    const passengerCapacity = new PassengerCapacity(command.passengerCapacity);

    // Entity 생성
    const vehicle = new Vehicle({
      id: randomUUID(),
      lastFourDigits,
      passengerCapacity,
      institutionId: command.institutionId,
      currentGroupId: command.currentGroupId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return this.vehicleRepository.create(vehicle);
  }

  /**
   * T076: 기관 내 모든 차량 조회
   */
  async getVehicles(institutionId: string): Promise<Vehicle[]> {
    return this.vehicleRepository.findAll(institutionId);
  }

  /**
   * T077: 차량 ID로 조회
   */
  async getVehicleById(id: string): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findById(id);

    if (!vehicle) {
      throw new NotFoundException('차량을 찾을 수 없습니다');
    }

    return vehicle;
  }

  /**
   * T078: 차량 정보 업데이트
   */
  async updateVehicle(command: UpdateVehicleCommand): Promise<Vehicle> {
    const vehicle = await this.getVehicleById(command.id);

    // 정원 변경
    if (command.passengerCapacity !== undefined) {
      const newCapacity = new PassengerCapacity(command.passengerCapacity);
      vehicle.updateCapacity(newCapacity);
    }

    // 그룹 할당/해제
    if (command.currentGroupId !== undefined) {
      if (command.currentGroupId === null) {
        vehicle.unassignFromGroup();
      } else {
        vehicle.assignToGroup(command.currentGroupId);
      }
    }

    return this.vehicleRepository.update(vehicle);
  }

  /**
   * T079: 차량 삭제
   */
  async deleteVehicle(id: string): Promise<void> {
    // 존재 여부 확인
    await this.getVehicleById(id);

    await this.vehicleRepository.delete(id);
  }
}
