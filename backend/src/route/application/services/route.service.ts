/**
 * Route Application Service
 */

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { IRouteRepository, ROUTE_REPOSITORY } from '../../domain/repositories/route.repository.interface';
import { VRPSolverService } from '../../infrastructure/algorithms/vrp-solver.service';
import { OptimizeRouteCommand } from '../commands/optimize-route.command';
import { Route, RouteStatus, ShuttleType } from '../../domain/entities/route.entity';
import { Coordinates } from '../../domain/value-objects/coordinates.vo';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RouteService {
  constructor(
    @Inject(ROUTE_REPOSITORY)
    private readonly routeRepository: IRouteRepository,
    private readonly vrpSolver: VRPSolverService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 경로 최적화 실행
   */
  async optimizeRoute(command: OptimizeRouteCommand): Promise<Route> {
    // 1. 기관 정보 조회 (depot 좌표)
    const institution = await this.prisma.institution.findUnique({
      where: { id: command.institutionId },
    });

    if (!institution) {
      throw new NotFoundException(
        `Institution not found: ${command.institutionId}`,
      );
    }

    if (!institution.latitude || !institution.longitude) {
      throw new Error(
        `Institution ${command.institutionId} has no coordinates`,
      );
    }

    const depot = new Coordinates(institution.latitude, institution.longitude);

    // 2. 차량 정보 조회 (capacity)
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: command.vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle not found: ${command.vehicleId}`);
    }

    // 3. 해당 날짜/셔틀 타입의 승객 목록 조회
    const passengers = await this.getPassengersForRoute(
      command.institutionId,
      command.routeDate,
      command.shuttleType,
    );

    if (passengers.length === 0) {
      throw new Error(
        `No passengers found for route on ${command.routeDate} ${command.shuttleType}`,
      );
    }

    if (passengers.length > vehicle.capacity) {
      throw new Error(
        `Too many passengers (${passengers.length}) for vehicle capacity (${vehicle.capacity})`,
      );
    }

    // 4. VRP 최적화 실행
    const optimizationResult = await this.vrpSolver.optimize({
      depot,
      passengers: passengers.map((p) => ({
        passengerId: p.id,
        coordinates: new Coordinates(p.latitude, p.longitude),
        address: p.pickupAddress,
      })),
      vehicleCapacity: vehicle.capacity,
      averageSpeed: command.averageSpeed,
    });

    // 5. 기존 경로 확인 (있으면 업데이트, 없으면 생성)
    let route = await this.routeRepository.findByInstitutionAndDate(
      command.institutionId,
      command.routeDate,
      command.shuttleType,
    );

    if (route) {
      // 기존 경로 업데이트
      route.markAsOptimized(
        optimizationResult.optimizedSequence,
        optimizationResult.totalDistance,
        optimizationResult.estimatedDuration,
        optimizationResult.optimizationTime,
        optimizationResult.solverVersion,
      );
      return await this.routeRepository.update(route);
    } else {
      // 새 경로 생성
      route = new Route(
        uuidv4(),
        command.institutionId,
        command.vehicleId,
        command.routeDate,
        command.shuttleType,
        optimizationResult.optimizedSequence,
        optimizationResult.totalDistance,
        optimizationResult.estimatedDuration,
        RouteStatus.OPTIMIZED,
        optimizationResult.optimizationTime,
        optimizationResult.solverVersion,
      );
      return await this.routeRepository.create(route);
    }
  }

  /**
   * 해당 날짜/셔틀 타입의 승객 목록 조회
   */
  private async getPassengersForRoute(
    institutionId: string,
    routeDate: Date,
    shuttleType: ShuttleType,
  ): Promise<any[]> {
    // PassengerSchedule에서 해당 날짜의 스케줄 조회
    const dayOfWeek = this.getDayOfWeek(routeDate);

    const schedules = await this.prisma.passengerSchedule.findMany({
      where: {
        passenger: {
          institutionId,
        },
        dayOfWeek,
        shuttleType,
        isActive: true,
      },
      include: {
        passenger: true,
      },
    });

    return schedules.map((s) => s.passenger);
  }

  /**
   * Date를 요일로 변환 (0=일요일, 6=토요일)
   */
  private getDayOfWeek(date: Date): number {
    return date.getDay();
  }

  /**
   * 경로 조회 (ID)
   */
  async getRouteById(id: string): Promise<Route> {
    const route = await this.routeRepository.findById(id);
    if (!route) {
      throw new NotFoundException(`Route not found: ${id}`);
    }
    return route;
  }

  /**
   * 기관의 경로 목록 조회
   */
  async getRoutesByInstitution(institutionId: string): Promise<Route[]> {
    return await this.routeRepository.findByInstitution(institutionId);
  }

  /**
   * 차량의 경로 목록 조회
   */
  async getRoutesByVehicle(vehicleId: string): Promise<Route[]> {
    return await this.routeRepository.findByVehicle(vehicleId);
  }

  /**
   * 경로 상태 업데이트 (운행 시작)
   */
  async startRoute(id: string): Promise<Route> {
    const route = await this.getRouteById(id);
    route.startTrip();
    return await this.routeRepository.update(route);
  }

  /**
   * 경로 상태 업데이트 (운행 완료)
   */
  async completeRoute(id: string): Promise<Route> {
    const route = await this.getRouteById(id);
    route.completeTrip();
    return await this.routeRepository.update(route);
  }
}
