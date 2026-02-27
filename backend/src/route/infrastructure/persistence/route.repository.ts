/**
 * Route Repository Implementation (Prisma)
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { IRouteRepository } from '../../domain/repositories/route.repository.interface';
import {
  Route,
  ShuttleType,
  RouteStatus,
  WaypointData,
} from '../../domain/entities/route.entity';
import { Coordinates } from '../../domain/value-objects/coordinates.vo';

@Injectable()
export class RouteRepository implements IRouteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Route | null> {
    const route = await this.prisma.route.findUnique({
      where: { id },
    });

    return route ? this.toDomain(route) : null;
  }

  async create(route: Route): Promise<Route> {
    const created = await this.prisma.route.create({
      data: {
        id: route.id,
        institutionId: route.institutionId,
        vehicleId: route.vehicleId,
        routeDate: route.routeDate,
        shuttleType: route.shuttleType,
        optimizedSequence: this.waypointsToJSON(route.optimizedSequence),
        totalDistance: route.totalDistance,
        estimatedDuration: route.estimatedDuration,
        status: route.status,
        optimizationTime: route.optimizationTime,
        solverVersion: route.solverVersion,
      },
    });

    return this.toDomain(created);
  }

  async update(route: Route): Promise<Route> {
    const updated = await this.prisma.route.update({
      where: { id: route.id },
      data: {
        optimizedSequence: this.waypointsToJSON(route.optimizedSequence),
        totalDistance: route.totalDistance,
        estimatedDuration: route.estimatedDuration,
        status: route.status,
        optimizationTime: route.optimizationTime,
        solverVersion: route.solverVersion,
      },
    });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.route.delete({
      where: { id },
    });
  }

  async findByInstitutionAndDate(
    institutionId: string,
    routeDate: Date,
    shuttleType: ShuttleType,
  ): Promise<Route | null> {
    const startOfDay = new Date(routeDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(routeDate);
    endOfDay.setHours(23, 59, 59, 999);

    const route = await this.prisma.route.findFirst({
      where: {
        institutionId,
        routeDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        shuttleType,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return route ? this.toDomain(route) : null;
  }

  async findByInstitution(institutionId: string): Promise<Route[]> {
    const routes = await this.prisma.route.findMany({
      where: { institutionId },
      orderBy: { routeDate: 'desc' },
    });

    return routes.map((route) => this.toDomain(route));
  }

  async findByVehicle(vehicleId: string): Promise<Route[]> {
    const routes = await this.prisma.route.findMany({
      where: { vehicleId },
      orderBy: { routeDate: 'desc' },
    });

    return routes.map((route) => this.toDomain(route));
  }

  async findByStatus(status: RouteStatus): Promise<Route[]> {
    const routes = await this.prisma.route.findMany({
      where: { status },
      orderBy: { routeDate: 'desc' },
    });

    return routes.map((route) => this.toDomain(route));
  }

  /**
   * Prisma 모델을 Domain Entity로 변환
   */
  private toDomain(prismaRoute: any): Route {
    const optimizedSequence = this.waypointsFromJSON(
      prismaRoute.optimizedSequence,
    );

    return new Route(
      prismaRoute.id,
      prismaRoute.institutionId,
      prismaRoute.vehicleId,
      prismaRoute.routeDate,
      prismaRoute.shuttleType as ShuttleType,
      optimizedSequence,
      prismaRoute.totalDistance,
      prismaRoute.estimatedDuration,
      prismaRoute.status as RouteStatus,
      prismaRoute.optimizationTime,
      prismaRoute.solverVersion,
      prismaRoute.createdAt,
      prismaRoute.updatedAt,
    );
  }

  /**
   * WaypointData[]를 JSON으로 변환
   */
  private waypointsToJSON(waypoints: WaypointData[]): any {
    return waypoints.map((w) => ({
      passengerId: w.passengerId,
      sequence: w.sequence,
      lat: w.coordinates.lat,
      lng: w.coordinates.lng,
      address: w.address,
      eta: w.eta?.toISOString(),
    }));
  }

  /**
   * JSON을 WaypointData[]로 변환
   */
  private waypointsFromJSON(json: any): WaypointData[] {
    if (!Array.isArray(json)) {
      return [];
    }

    return json.map((item) => ({
      passengerId: item.passengerId,
      sequence: item.sequence,
      coordinates: new Coordinates(item.lat, item.lng),
      address: item.address,
      eta: item.eta ? new Date(item.eta) : undefined,
    }));
  }
}
