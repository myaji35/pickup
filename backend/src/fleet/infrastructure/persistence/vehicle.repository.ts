import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { IVehicleRepository } from '../../domain/repositories/vehicle.repository.interface';
import { Vehicle } from '../../domain/entities/vehicle.entity';
import { LicensePlateLastFour } from '../../domain/value-objects/license-plate-last-four.vo';
import { PassengerCapacity } from '../../domain/value-objects/passenger-capacity.vo';
import { Vehicle as PrismaVehicle } from '@prisma/client';

/**
 * VehicleRepository Implementation
 * Prisma를 사용한 Vehicle Repository 구현
 * Domain Entity와 Prisma Model 간의 매핑 담당
 */
@Injectable()
export class VehicleRepository implements IVehicleRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * T081: 차량 생성
   */
  async create(vehicle: Vehicle): Promise<Vehicle> {
    const prismaVehicle = await this.prisma.vehicle.create({
      data: {
        id: vehicle.id,
        lastFourDigits: vehicle.lastFourDigits.value,
        passengerCapacity: vehicle.passengerCapacity.value,
        institutionId: vehicle.institutionId,
        currentGroupId: vehicle.currentGroupId,
        createdAt: vehicle.createdAt,
        updatedAt: vehicle.updatedAt,
      },
    });

    return this.toDomain(prismaVehicle);
  }

  /**
   * T082: 기관 내 모든 차량 조회
   */
  async findAll(institutionId: string): Promise<Vehicle[]> {
    const prismaVehicles = await this.prisma.vehicle.findMany({
      where: {
        institutionId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return prismaVehicles.map((v) => this.toDomain(v));
  }

  /**
   * T083: ID로 차량 조회
   */
  async findById(id: string): Promise<Vehicle | null> {
    const prismaVehicle = await this.prisma.vehicle.findUnique({
      where: { id },
    });

    return prismaVehicle ? this.toDomain(prismaVehicle) : null;
  }

  /**
   * 기관 내 차량번호 뒤 4자리로 조회 (중복 검증용)
   */
  async findByLastFourDigits(
    institutionId: string,
    lastFourDigits: string,
  ): Promise<Vehicle | null> {
    const prismaVehicle = await this.prisma.vehicle.findUnique({
      where: {
        institutionId_lastFourDigits: {
          institutionId,
          lastFourDigits,
        },
      },
    });

    return prismaVehicle ? this.toDomain(prismaVehicle) : null;
  }

  /**
   * T084: 차량 정보 업데이트
   */
  async update(vehicle: Vehicle): Promise<Vehicle> {
    const prismaVehicle = await this.prisma.vehicle.update({
      where: { id: vehicle.id },
      data: {
        lastFourDigits: vehicle.lastFourDigits.value,
        passengerCapacity: vehicle.passengerCapacity.value,
        currentGroupId: vehicle.currentGroupId,
        updatedAt: vehicle.updatedAt,
      },
    });

    return this.toDomain(prismaVehicle);
  }

  /**
   * T085: 차량 삭제
   */
  async delete(id: string): Promise<void> {
    await this.prisma.vehicle.delete({
      where: { id },
    });
  }

  /**
   * T086: Prisma to Domain 매핑
   * Prisma 모델 → Domain Entity 변환
   */
  private toDomain(prismaVehicle: PrismaVehicle): Vehicle {
    return new Vehicle({
      id: prismaVehicle.id,
      lastFourDigits: new LicensePlateLastFour(prismaVehicle.lastFourDigits),
      passengerCapacity: new PassengerCapacity(prismaVehicle.passengerCapacity),
      institutionId: prismaVehicle.institutionId,
      currentGroupId: prismaVehicle.currentGroupId,
      createdAt: prismaVehicle.createdAt,
      updatedAt: prismaVehicle.updatedAt,
    });
  }

  /**
   * T087: Domain to Prisma 매핑
   * Domain Entity → Prisma 모델 변환 (create/update에서 사용)
   * Note: 이미 create, update 메서드에서 인라인으로 구현되어 있음
   */
}
