/**
 * Trip API — Epic 8 (Guardian)
 * Rails API /api/v1/guardian/trips 연동
 */

import { apiClient } from './client';
import { ApiResponse, Trip, ActiveTrip } from '../types';

// 이번 주 + 다음 주 운행 목록
export const getMyTrips = async (): Promise<Trip[]> => {
  const res = await apiClient.get<ApiResponse<Trip[]>>('/api/v1/guardian/trips');
  return res.data.data;
};

// 현재 운행 중인 trip (실시간 추적용 폴링)
export const getActiveTrip = async (): Promise<ActiveTrip | null> => {
  const res = await apiClient.get<ApiResponse<ActiveTrip | null>>('/api/v1/guardian/trips/active');
  return res.data.data;
};

// 당일 탑승 취소
export const cancelTrip = async (tripId: number, reason?: string): Promise<void> => {
  await apiClient.post(`/api/v1/guardian/trips/${tripId}/cancel`, { reason });
};
