/**
 * Trip Repository Implementation (Phase 12)
 *
 * Prisma를 사용한 운행 저장소 구현
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ITripRepository } from '../../domain/repositories/trip.repository.interface';
import {
  Trip,
  TripStatus,
  TripType,
  GpsLocation,
} from '../../domain/entities/trip.entity';

@Injectable()
export class TripRepository implements ITripRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(trip: Trip): Promise<Trip> {
    const created = await this.prisma.trip.create({
      data: {
        id: trip.id,
        institutionId: trip.institutionId,
        vehicleId: trip.vehicleId,
        driverId: trip.driverId,
        routeId: trip.routeId,
        type: trip.type,
        status: trip.status,
        scheduledStart: trip.scheduledStart,
        actualStart: trip.actualStart,
        actualEnd: trip.actualEnd,
        startLocation: trip.startLocation
          ? JSON.parse(JSON.stringify(trip.startLocation))
          : null,
        endLocation: trip.endLocation
          ? JSON.parse(JSON.stringify(trip.endLocation))
          : null,
      },
    });

    return this.toDomain(created);
  }

  async findById(id: string): Promise<Trip | null> {
    const trip = await this.prisma.trip.findUnique({
      where: { id },
    });

    return trip ? this.toDomain(trip) : null;
  }

  async update(id: string, data: Partial<Trip>): Promise<Trip> {
    const updated = await this.prisma.trip.update({
      where: { id },
      data: {
        status: data.status,
        actualStart: data.actualStart,
        actualEnd: data.actualEnd,
        startLocation: data.startLocation
          ? JSON.parse(JSON.stringify(data.startLocation))
          : undefined,
        endLocation: data.endLocation
          ? JSON.parse(JSON.stringify(data.endLocation))
          : undefined,
        updatedAt: new Date(),
      },
    });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.trip.delete({
      where: { id },
    });
  }

  async findByDriverAndDate(driverId: string, date: Date): Promise<Trip[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const trips = await this.prisma.trip.findMany({
      where: {
        driverId,
        scheduledStart: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: {
        scheduledStart: 'asc',
      },
    });

    return trips.map((trip) => this.toDomain(trip));
  }

  async findByInstitutionAndDate(
    institutionId: string,
    date: Date,
  ): Promise<Trip[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const trips = await this.prisma.trip.findMany({
      where: {
        institutionId,
        scheduledStart: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: {
        scheduledStart: 'asc',
      },
    });

    return trips.map((trip) => this.toDomain(trip));
  }

  async findByVehicleAndDate(vehicleId: string, date: Date): Promise<Trip[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const trips = await this.prisma.trip.findMany({
      where: {
        vehicleId,
        scheduledStart: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: {
        scheduledStart: 'asc',
      },
    });

    return trips.map((trip) => this.toDomain(trip));
  }

  async findInProgressByDriver(driverId: string): Promise<Trip | null> {
    const trip = await this.prisma.trip.findFirst({
      where: {
        driverId,
        status: 'IN_PROGRESS',
      },
      orderBy: {
        actualStart: 'desc',
      },
    });

    return trip ? this.toDomain(trip) : null;
  }

  async findByStatus(
    institutionId: string,
    status: TripStatus,
    limit?: number,
  ): Promise<Trip[]> {
    const trips = await this.prisma.trip.findMany({
      where: {
        institutionId,
        status,
      },
      orderBy: {
        scheduledStart: 'desc',
      },
      take: limit,
    });

    return trips.map((trip) => this.toDomain(trip));
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.trip.count({
      where: { id },
    });

    return count > 0;
  }

  /**
   * Prisma 모델을 Domain Entity로 변환
   */
  private toDomain(prismaTrip: any): Trip {
    return new Trip(
      prismaTrip.id,
      prismaTrip.institutionId,
      prismaTrip.vehicleId,
      prismaTrip.driverId,
      prismaTrip.routeId,
      prismaTrip.type as TripType,
      prismaTrip.status as TripStatus,
      prismaTrip.scheduledStart,
      prismaTrip.actualStart,
      prismaTrip.actualEnd,
      prismaTrip.startLocation as GpsLocation | null,
      prismaTrip.endLocation as GpsLocation | null,
      prismaTrip.createdAt,
      prismaTrip.updatedAt,
    );
  }
}
