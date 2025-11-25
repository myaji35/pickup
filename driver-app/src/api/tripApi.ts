/**
 * Trip API (Phase 12.3)
 *
 * 운행 관련 API 호출 함수
 */

import apiClient from './client';
import {
  ApiResponse,
  Trip,
  TripDetailResponse,
  StartTripRequest,
  EndTripRequest,
} from '../types';

/**
 * GET /driver/trips/today
 * 오늘의 운행 목록 조회
 */
export const getTodayTrips = async (): Promise<ApiResponse<Trip[]>> => {
  const response = await apiClient.get<ApiResponse<Trip[]>>(
    '/driver/trips/today'
  );
  return response.data;
};

/**
 * GET /driver/trips/:id
 * 운행 상세 조회 (체크인 포함)
 */
export const getTripDetail = async (
  tripId: string
): Promise<ApiResponse<TripDetailResponse>> => {
  const response = await apiClient.get<ApiResponse<TripDetailResponse>>(
    `/driver/trips/${tripId}`
  );
  return response.data;
};

/**
 * POST /driver/trips/:id/start
 * 운행 시작
 */
export const startTrip = async (
  tripId: string,
  startLocation: { lat: number; lng: number }
): Promise<ApiResponse<Trip>> => {
  const response = await apiClient.post<ApiResponse<Trip>>(
    `/driver/trips/${tripId}/start`,
    { startLocation }
  );
  return response.data;
};

/**
 * POST /driver/trips/:id/end
 * 운행 종료
 */
export const endTrip = async (
  tripId: string,
  endLocation: { lat: number; lng: number }
): Promise<ApiResponse<Trip>> => {
  const response = await apiClient.post<ApiResponse<Trip>>(
    `/driver/trips/${tripId}/end`,
    { endLocation }
  );
  return response.data;
};

/**
 * GET /driver/trips/in-progress
 * 현재 진행 중인 운행 조회
 */
export const getInProgressTrip =
  async (): Promise<ApiResponse<TripDetailResponse | null>> => {
    const response = await apiClient.get<
      ApiResponse<TripDetailResponse | null>
    >('/driver/trips/in-progress');
    return response.data;
  };
