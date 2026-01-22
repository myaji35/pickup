/**
 * VRP Solver Service
 * Nearest Neighbor 알고리즘을 사용한 경로 최적화
 *
 * 알고리즘:
 * 1. 기관(depot)에서 시작
 * 2. 현재 위치에서 가장 가까운 미방문 승객 선택
 * 3. 모든 승객을 방문할 때까지 반복
 * 4. 마지막으로 기관으로 복귀
 */

import { Injectable } from '@nestjs/common';
import { Coordinates } from '../../domain/value-objects/coordinates.vo';
import { WaypointData } from '../../domain/entities/route.entity';

export interface PassengerLocation {
  passengerId: string;
  coordinates: Coordinates;
  address: string;
}

export interface OptimizationInput {
  depot: Coordinates; // 기관 위치
  passengers: PassengerLocation[];
  vehicleCapacity: number;
  averageSpeed?: number; // km/h (기본값: 30)
}

export interface OptimizationResult {
  optimizedSequence: WaypointData[];
  totalDistance: number; // km
  estimatedDuration: number; // minutes
  optimizationTime: number; // ms
  solverVersion: string;
}

@Injectable()
export class VRPSolverService {
  private readonly DEFAULT_AVERAGE_SPEED = 30; // km/h (도심 평균 속도)
  private readonly SOLVER_VERSION = 'NearestNeighbor-1.0';

  /**
   * 경로 최적화 실행
   */
  async optimize(input: OptimizationInput): Promise<OptimizationResult> {
    const startTime = Date.now();

    // 입력 검증
    this.validateInput(input);

    // Nearest Neighbor 알고리즘 실행
    const optimizedSequence = this.nearestNeighbor(
      input.depot,
      input.passengers,
    );

    // 총 거리 및 소요 시간 계산
    const { totalDistance, estimatedDuration } = this.calculateMetrics(
      input.depot,
      optimizedSequence,
      input.averageSpeed || this.DEFAULT_AVERAGE_SPEED,
    );

    const optimizationTime = Date.now() - startTime;

    return {
      optimizedSequence,
      totalDistance,
      estimatedDuration,
      optimizationTime,
      solverVersion: this.SOLVER_VERSION,
    };
  }

  /**
   * Nearest Neighbor 알고리즘
   */
  private nearestNeighbor(
    depot: Coordinates,
    passengers: PassengerLocation[],
  ): WaypointData[] {
    const unvisited = [...passengers];
    const sequence: WaypointData[] = [];
    let currentLocation = depot;
    let sequenceNumber = 1;

    while (unvisited.length > 0) {
      // 현재 위치에서 가장 가까운 승객 찾기
      let nearestIndex = 0;
      let minDistance = currentLocation.distanceTo(
        unvisited[0].coordinates,
      );

      for (let i = 1; i < unvisited.length; i++) {
        const distance = currentLocation.distanceTo(
          unvisited[i].coordinates,
        );
        if (distance < minDistance) {
          minDistance = distance;
          nearestIndex = i;
        }
      }

      // 가장 가까운 승객을 경로에 추가
      const nearest = unvisited[nearestIndex];
      sequence.push({
        passengerId: nearest.passengerId,
        sequence: sequenceNumber++,
        coordinates: nearest.coordinates,
        address: nearest.address,
      });

      // 방문한 승객 제거
      unvisited.splice(nearestIndex, 1);

      // 현재 위치 업데이트
      currentLocation = nearest.coordinates;
    }

    return sequence;
  }

  /**
   * 거리 및 소요 시간 계산
   */
  private calculateMetrics(
    depot: Coordinates,
    sequence: WaypointData[],
    averageSpeed: number,
  ): { totalDistance: number; estimatedDuration: number } {
    let totalDistance = 0;
    let currentLocation = depot;

    // 기관 → 첫 승객 → ... → 마지막 승객 → 기관
    for (const waypoint of sequence) {
      totalDistance += currentLocation.distanceTo(waypoint.coordinates);
      currentLocation = waypoint.coordinates;
    }

    // 마지막 승객 → 기관 복귀
    if (sequence.length > 0) {
      totalDistance += currentLocation.distanceTo(depot);
    }

    // 소요 시간 계산 (분)
    const estimatedDuration = Math.ceil((totalDistance / averageSpeed) * 60);

    return {
      totalDistance: Math.round(totalDistance * 100) / 100, // 소수점 2자리
      estimatedDuration,
    };
  }

  /**
   * 입력 검증
   */
  private validateInput(input: OptimizationInput): void {
    if (!input.depot) {
      throw new Error('Depot location is required');
    }

    if (!input.passengers || input.passengers.length === 0) {
      throw new Error('At least one passenger is required');
    }

    if (input.passengers.length > input.vehicleCapacity) {
      throw new Error(
        `Too many passengers (${input.passengers.length}) for vehicle capacity (${input.vehicleCapacity})`,
      );
    }

    // 좌표 유효성 검증
    for (const passenger of input.passengers) {
      if (!passenger.coordinates) {
        throw new Error(
          `Passenger ${passenger.passengerId} has no coordinates`,
        );
      }
    }
  }

  /**
   * 2-opt 최적화 (선택적 개선)
   * 경로를 더 최적화하기 위해 2-opt 알고리즘 적용
   */
  twoOptOptimization(
    depot: Coordinates,
    sequence: WaypointData[],
  ): WaypointData[] {
    if (sequence.length < 4) {
      return sequence; // 너무 짧으면 개선 불가
    }

    let improved = true;
    let bestSequence = [...sequence];

    while (improved) {
      improved = false;
      const currentDistance = this.calculateTotalDistance(depot, bestSequence);

      for (let i = 0; i < bestSequence.length - 1; i++) {
        for (let j = i + 2; j < bestSequence.length; j++) {
          // 순서 뒤집기
          const newSequence = [
            ...bestSequence.slice(0, i + 1),
            ...bestSequence.slice(i + 1, j + 1).reverse(),
            ...bestSequence.slice(j + 1),
          ];

          const newDistance = this.calculateTotalDistance(depot, newSequence);

          if (newDistance < currentDistance) {
            bestSequence = newSequence;
            improved = true;
            break;
          }
        }
        if (improved) break;
      }
    }

    // sequence 번호 재할당
    return bestSequence.map((waypoint, index) => ({
      ...waypoint,
      sequence: index + 1,
    }));
  }

  private calculateTotalDistance(
    depot: Coordinates,
    sequence: WaypointData[],
  ): number {
    let totalDistance = 0;
    let currentLocation = depot;

    for (const waypoint of sequence) {
      totalDistance += currentLocation.distanceTo(waypoint.coordinates);
      currentLocation = waypoint.coordinates;
    }

    // 복귀
    if (sequence.length > 0) {
      totalDistance += currentLocation.distanceTo(depot);
    }

    return totalDistance;
  }
}
