import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { IPassengerScheduleRepository } from '../../domain/repositories/passenger-schedule.repository.interface';
import { PassengerSchedule } from '../../domain/entities/passenger-schedule.entity';
import { PassengerSchedule as PrismaPassengerSchedule } from '@prisma/client';

/**
 * T347: PassengerScheduleRepository Implementation
 * Prisma를 사용한 PassengerSchedule Repository 구현
 * Domain Entity와 Prisma Model 간의 매핑 담당
 */
@Injectable()
export class PassengerScheduleRepository implements IPassengerScheduleRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * T348: 스케줄 생성 또는 업데이트 (upsert)
   * passengerId를 기준으로 이미 존재하면 update, 없으면 create
   */
  async upsert(schedule: PassengerSchedule): Promise<PassengerSchedule> {
    const prismaSchedule = await this.prisma.passengerSchedule.upsert({
      where: { passengerId: schedule.passengerId },
      update: {
        pickupTime: schedule.pickupTime,
        dropoffTime: schedule.dropoffTime,
        careTimeHours: schedule.careTimeHours,
        isCareTimeInsufficient: schedule.isCareTimeInsufficient,
        updatedAt: schedule.updatedAt,
      },
      create: {
        id: schedule.id,
        passengerId: schedule.passengerId,
        pickupTime: schedule.pickupTime,
        dropoffTime: schedule.dropoffTime,
        careTimeHours: schedule.careTimeHours,
        isCareTimeInsufficient: schedule.isCareTimeInsufficient,
        createdAt: schedule.createdAt,
        updatedAt: schedule.updatedAt,
      },
    });

    return this.toDomain(prismaSchedule);
  }

  /**
   * T350: passengerId로 스케줄 조회
   */
  async findByPassengerId(passengerId: string): Promise<PassengerSchedule | null> {
    const prismaSchedule = await this.prisma.passengerSchedule.findUnique({
      where: { passengerId },
    });

    return prismaSchedule ? this.toDomain(prismaSchedule) : null;
  }

  /**
   * T349: 스케줄 삭제
   */
  async delete(passengerId: string): Promise<void> {
    await this.prisma.passengerSchedule.delete({
      where: { passengerId },
    });
  }

  /**
   * Prisma to Domain 매핑
   * Prisma 모델 → Domain Entity 변환
   */
  private toDomain(prismaSchedule: PrismaPassengerSchedule): PassengerSchedule {
    return new PassengerSchedule({
      id: prismaSchedule.id,
      passengerId: prismaSchedule.passengerId,
      pickupTime: prismaSchedule.pickupTime,
      dropoffTime: prismaSchedule.dropoffTime,
      careTimeHours: prismaSchedule.careTimeHours,
      isCareTimeInsufficient: prismaSchedule.isCareTimeInsufficient,
      createdAt: prismaSchedule.createdAt,
      updatedAt: prismaSchedule.updatedAt,
    });
  }
}
