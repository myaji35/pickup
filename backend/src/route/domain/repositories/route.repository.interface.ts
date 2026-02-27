/**
 * Route Repository Interface
 */

import { Route, ShuttleType, RouteStatus } from '../entities/route.entity';

export const ROUTE_REPOSITORY = Symbol('ROUTE_REPOSITORY');

export interface IRouteRepository {
  /**
   * ID로 경로 조회
   */
  findById(id: string): Promise<Route | null>;

  /**
   * 경로 생성
   */
  create(route: Route): Promise<Route>;

  /**
   * 경로 업데이트
   */
  update(route: Route): Promise<Route>;

  /**
   * 경로 삭제
   */
  delete(id: string): Promise<void>;

  /**
   * 기관의 특정 날짜/셔틀 타입 경로 조회
   */
  findByInstitutionAndDate(
    institutionId: string,
    routeDate: Date,
    shuttleType: ShuttleType,
  ): Promise<Route | null>;

  /**
   * 기관의 경로 목록 조회
   */
  findByInstitution(institutionId: string): Promise<Route[]>;

  /**
   * 차량의 경로 목록 조회
   */
  findByVehicle(vehicleId: string): Promise<Route[]>;

  /**
   * 상태별 경로 조회
   */
  findByStatus(status: RouteStatus): Promise<Route[]>;
}
