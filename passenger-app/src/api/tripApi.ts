/**
 * Trip API
 * 운행 관련 API 함수들
 */

import { apiClient } from './client';
import { Trip } from '../types';

/**
 * 나의 운행 스케줄 조회 (Passenger)
 */
export const getMyTrips = async (): Promise<Trip[]> => {
  const response = await apiClient.get<Trip[]>('/passenger/trips');
  return response.data;
};

/**
 * 운행 상세 조회
 */
export const getTripDetail = async (tripId: string): Promise<Trip> => {
  const response = await apiClient.get<Trip>(`/passenger/trips/${tripId}`);
  return response.data;
};

/**
 * 진행 중인 운행 조회 (차량 추적용)
 */
export const getInProgressTrip = async (): Promise<Trip | null> => {
  try {
    const response = await apiClient.get<{ success: boolean; data: Trip | null }>(
      '/passenger/trips/in-progress/current'
    );
    return response.data.data;
  } catch (error) {
    console.error('Failed to get in-progress trip:', error);
    return null;
  }
};
