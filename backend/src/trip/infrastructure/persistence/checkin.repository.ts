/**
 * CheckIn Repository Implementation (Phase 12)
 *
 * Prisma를 사용한 체크인 저장소 구현
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ICheckInRepository } from '../../domain/repositories/checkin.repository.interface';
import {
  CheckIn,
  CheckInType,
} from '../../domain/entities/checkin.entity';
import { GpsLocation } from '../../domain/entities/trip.entity';

@Injectable()
export class CheckInRepository implements ICheckInRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(checkIn: CheckIn): Promise<CheckIn> {
    const created = await this.prisma.checkIn.create({
      data: {
        id: checkIn.id,
        tripId: checkIn.tripId,
        passengerId: checkIn.passengerId,
        type: checkIn.type,
        timestamp: checkIn.timestamp,
        location: JSON.parse(JSON.stringify(checkIn.location)),
      },
    });

    return this.toDomain(created);
  }

  async findById(id: string): Promise<CheckIn | null> {
    const checkIn = await this.prisma.checkIn.findUnique({
      where: { id },
    });

    return checkIn ? this.toDomain(checkIn) : null;
  }

  async findByTrip(tripId: string): Promise<CheckIn[]> {
    const checkIns = await this.prisma.checkIn.findMany({
      where: { tripId },
      orderBy: {
        timestamp: 'asc',
      },
    });

    return checkIns.map((c) => this.toDomain(c));
  }

  async findByTripAndType(
    tripId: string,
    type: CheckInType,
  ): Promise<CheckIn[]> {
    const checkIns = await this.prisma.checkIn.findMany({
      where: {
        tripId,
        type,
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    return checkIns.map((c) => this.toDomain(c));
  }

  async findByPassenger(
    passengerId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<CheckIn[]> {
    const checkIns = await this.prisma.checkIn.findMany({
      where: {
        passengerId,
        ...(startDate &&
          endDate && {
            timestamp: {
              gte: startDate,
              lte: endDate,
            },
          }),
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    return checkIns.map((c) => this.toDomain(c));
  }

  async findByTripAndPassenger(
    tripId: string,
    passengerId: string,
  ): Promise<CheckIn[]> {
    const checkIns = await this.prisma.checkIn.findMany({
      where: {
        tripId,
        passengerId,
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    return checkIns.map((c) => this.toDomain(c));
  }

  async exists(
    tripId: string,
    passengerId: string,
    type: CheckInType,
  ): Promise<boolean> {
    const count = await this.prisma.checkIn.count({
      where: {
        tripId,
        passengerId,
        type,
      },
    });

    return count > 0;
  }

  async countByTrip(tripId: string): Promise<number> {
    return await this.prisma.checkIn.count({
      where: { tripId },
    });
  }

  async countBoardingByTrip(tripId: string): Promise<number> {
    return await this.prisma.checkIn.count({
      where: {
        tripId,
        type: 'BOARDING',
      },
    });
  }

  /**
   * Prisma 모델을 Domain Entity로 변환
   */
  private toDomain(prismaCheckIn: any): CheckIn {
    return new CheckIn(
      prismaCheckIn.id,
      prismaCheckIn.tripId,
      prismaCheckIn.passengerId,
      prismaCheckIn.type as CheckInType,
      prismaCheckIn.timestamp,
      prismaCheckIn.location as GpsLocation,
      prismaCheckIn.createdAt,
    );
  }
}
