/**
 * Route Entity
 * 최적화된 경로 (VRP 결과)
 */

import { Coordinates } from '../value-objects/coordinates.vo';

export enum ShuttleType {
  MORNING = 'MORNING',
  EVENING = 'EVENING',
  TEMPORARY = 'TEMPORARY',
}

export enum RouteStatus {
  DRAFT = 'DRAFT', // 초안
  OPTIMIZED = 'OPTIMIZED', // 최적화 완료
  IN_PROGRESS = 'IN_PROGRESS', // 운행 중
  COMPLETED = 'COMPLETED', // 완료
}

export interface WaypointData {
  passengerId: string;
  sequence: number;
  coordinates: Coordinates;
  address: string;
  eta?: Date; // Estimated Time of Arrival
}

export class Route {
  constructor(
    public readonly id: string,
    public readonly institutionId: string,
    public readonly vehicleId: string,
    public readonly routeDate: Date,
    public readonly shuttleType: ShuttleType,
    public optimizedSequence: WaypointData[],
    public totalDistance: number, // km
    public estimatedDuration: number, // minutes
    public status: RouteStatus,
    public optimizationTime?: number, // ms
    public solverVersion?: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}

  /**
   * 경로 최적화 완료
   */
  markAsOptimized(
    optimizedSequence: WaypointData[],
    totalDistance: number,
    estimatedDuration: number,
    optimizationTime: number,
    solverVersion: string,
  ): void {
    this.optimizedSequence = optimizedSequence;
    this.totalDistance = totalDistance;
    this.estimatedDuration = estimatedDuration;
    this.optimizationTime = optimizationTime;
    this.solverVersion = solverVersion;
    this.status = RouteStatus.OPTIMIZED;
  }

  /**
   * 운행 시작
   */
  startTrip(): void {
    if (this.status !== RouteStatus.OPTIMIZED) {
      throw new Error('Route must be optimized before starting trip');
    }
    this.status = RouteStatus.IN_PROGRESS;
  }

  /**
   * 운행 완료
   */
  completeTrip(): void {
    if (this.status !== RouteStatus.IN_PROGRESS) {
      throw new Error('Route must be in progress to complete');
    }
    this.status = RouteStatus.COMPLETED;
  }

  /**
   * 승객 수 반환
   */
  getPassengerCount(): number {
    return this.optimizedSequence.length;
  }

  /**
   * 특정 승객의 순서 찾기
   */
  getPassengerSequence(passengerId: string): number | null {
    const waypoint = this.optimizedSequence.find(
      (w) => w.passengerId === passengerId,
    );
    return waypoint?.sequence ?? null;
  }

  /**
   * 승객 목록 반환
   */
  getPassengerIds(): string[] {
    return this.optimizedSequence.map((w) => w.passengerId);
  }

  /**
   * 평균 속도 계산 (km/h)
   */
  getAverageSpeed(): number {
    if (this.estimatedDuration === 0) return 0;
    return (this.totalDistance / this.estimatedDuration) * 60;
  }

  /**
   * ETA 업데이트 (운행 중 실시간 업데이트)
   */
  updateETAs(currentLocation: Coordinates, currentTime: Date): void {
    // 현재 위치에서 가장 가까운 다음 waypoint 찾기
    let minDistance = Infinity;
    let nextWaypointIndex = 0;

    this.optimizedSequence.forEach((waypoint, index) => {
      const distance = currentLocation.distanceTo(waypoint.coordinates);
      if (distance < minDistance) {
        minDistance = distance;
        nextWaypointIndex = index;
      }
    });

    // 다음 waypoint부터 ETA 재계산
    let cumulativeTime = currentTime.getTime();
    let prevCoordinates = currentLocation;

    for (let i = nextWaypointIndex; i < this.optimizedSequence.length; i++) {
      const waypoint = this.optimizedSequence[i];
      const distance = prevCoordinates.distanceTo(waypoint.coordinates);
      const timeMinutes = (distance / this.getAverageSpeed()) * 60;

      cumulativeTime += timeMinutes * 60 * 1000; // minutes to ms
      waypoint.eta = new Date(cumulativeTime);

      prevCoordinates = waypoint.coordinates;
    }
  }
}
