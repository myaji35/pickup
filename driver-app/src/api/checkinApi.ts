/**
 * CheckIn API (Phase 12.3)
 *
 * 체크인 관련 API 호출 함수
 */

import apiClient from './client';
import { ApiResponse, CheckIn, CheckInType, GpsLocation } from '../types';

/**
 * POST /driver/checkin
 * 체크인 생성 (탑승/하차)
 */
export const createCheckIn = async (
  tripId: string,
  passengerId: string,
  type: CheckInType,
  location: GpsLocation
): Promise<ApiResponse<CheckIn>> => {
  const response = await apiClient.post<ApiResponse<CheckIn>>(
    '/driver/checkin',
    {
      tripId,
      passengerId,
      type,
      timestamp: new Date().toISOString(),
      location,
    }
  );
  return response.data;
};

/**
 * GET /driver/trips/:id/checkins
 * 운행의 체크인 목록 조회
 */
export const getTripCheckIns = async (
  tripId: string
): Promise<
  ApiResponse<{
    checkIns: CheckIn[];
    stats: {
      totalCheckIns: number;
      boardingCount: number;
      alightingCount: number;
    };
  }>
> => {
  const response = await apiClient.get<
    ApiResponse<{
      checkIns: CheckIn[];
      stats: {
        totalCheckIns: number;
        boardingCount: number;
        alightingCount: number;
      };
    }>
  >(`/driver/trips/${tripId}/checkins`);
  return response.data;
};
