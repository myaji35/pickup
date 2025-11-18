import { Injectable, ConflictException, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { Vehicle } from '../../domain/entities/vehicle.entity';
import { LicensePlateLastFour } from '../../domain/value-objects/license-plate-last-four.vo';
import { PassengerCapacity } from '../../domain/value-objects/passenger-capacity.vo';
import { CreateVehicleCommand } from '../commands/create-vehicle.command';
import { UpdateVehicleCommand } from '../commands/update-vehicle.command';
import { ConnectVehicleToGroupCommand } from '../commands/connect-vehicle-to-group.command';
import { DisconnectVehicleFromGroupCommand } from '../commands/disconnect-vehicle-from-group.command';
import { randomUUID } from 'crypto';
import { PassengerGroupService } from '../../../roster/application/services/passenger-group.service';

/**
 * VehicleService
 * 차량 관리 비즈니스 로직
 */
@Injectable()
export class VehicleService {
  constructor(
    @Inject('IVehicleRepository')
    private readonly vehicleRepository: IVehicleRepository,
    private readonly passengerGroupService: PassengerGroupService,
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
   * T079 & T251: 차량 삭제
   * 차량 삭제 시 그룹과 승객은 유지됨 (cascade delete 방지)
   */
  async deleteVehicle(id: string): Promise<void> {
    // 존재 여부 확인
    await this.getVehicleById(id);

    await this.vehicleRepository.delete(id);
  }

  /**
   * T248-T249: 차량을 그룹에 연결 (용량 검증 포함)
   *
   * 비즈니스 규칙:
   * - 차량 정원 >= 그룹 승객 수 (용량 검증 필수)
   * - 이미 다른 그룹에 연결된 차량은 새 그룹으로 재연결 가능
   * - 같은 그룹에 재연결 시 idempotent (멱등성)
   */
  async connectToGroup(command: ConnectVehicleToGroupCommand): Promise<Vehicle> {
    // 1. 차량 존재 확인
    const vehicle = await this.getVehicleById(command.vehicleId);

    // 2. 그룹 존재 확인 및 조회
    const group = await this.passengerGroupService.getGroupById(command.groupId);

    // 3. 용량 검증: 차량 정원 >= 그룹 승객 수
    const vehicleCapacity = vehicle.passengerCapacity.value;
    const groupPassengerCount = group.totalPassengerCount;

    if (vehicleCapacity < groupPassengerCount) {
      throw new BadRequestException(
        `Vehicle capacity (${vehicleCapacity}) is less than group passenger count (${groupPassengerCount}). ` +
        `Cannot connect vehicle to group.`,
      );
    }

    // 4. 차량을 그룹에 할당
    vehicle.assignToGroup(command.groupId);

    // 5. 업데이트 저장
    return this.vehicleRepository.update(vehicle);
  }

  /**
   * T250: 차량의 그룹 연결 해제
   *
   * 비즈니스 규칙:
   * - 그룹과 승객은 유지됨 (차량만 해제)
   * - 이미 연결되지 않은 차량에 대해 호출 시 idempotent (멱등성)
   */
  async disconnectFromGroup(command: DisconnectVehicleFromGroupCommand): Promise<Vehicle> {
    // 1. 차량 존재 확인
    const vehicle = await this.getVehicleById(command.vehicleId);

    // 2. 그룹 할당 해제
    vehicle.unassignFromGroup();

    // 3. 업데이트 저장
    return this.vehicleRepository.update(vehicle);
  }
}
