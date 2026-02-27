import apiClient from './client';
import { ApiResponse, Trip, TripDetail, LocationUpdate } from '../types';
import { DrivingEvent } from '../services/obd2/elm327';

// GET /driver/trips?date=YYYY-MM-DD
export const getTodayTrips = async (): Promise<ApiResponse<Trip[]>> => {
  const today = new Date().toISOString().slice(0, 10);
  const res = await apiClient.get<ApiResponse<Trip[]>>('/driver/trips', {
    params: { date: today },
  });
  return res.data;
};

// GET /driver/trips/:id
export const getTripDetail = async (tripId: number): Promise<ApiResponse<TripDetail>> => {
  const res = await apiClient.get<ApiResponse<TripDetail>>(`/driver/trips/${tripId}`);
  return res.data;
};

// POST /driver/trips/:id/start
export const startTrip = async (tripId: number): Promise<ApiResponse<Trip>> => {
  const res = await apiClient.post<ApiResponse<Trip>>(`/driver/trips/${tripId}/start`);
  return res.data;
};

// POST /driver/trips/:id/end
export const endTrip = async (tripId: number): Promise<ApiResponse<Trip>> => {
  const res = await apiClient.post<ApiResponse<Trip>>(`/driver/trips/${tripId}/end`);
  return res.data;
};

// POST /driver/trips/:id/update_location (OBD 데이터 포함)
export const updateLocation = async (
  tripId: number,
  lat: number,
  lng: number,
  heading?: number,
  speed?: number,
  obdPayload?: {
    rpm?: number;
    coolant_temp?: number;
    fuel_level?: number;
    throttle?: number;
    events?: Array<{ event_type: string; speed: number; rpm: number }>;
  }
): Promise<ApiResponse<LocationUpdate>> => {
  const res = await apiClient.post<ApiResponse<LocationUpdate>>(
    `/driver/trips/${tripId}/update_location`,
    { lat, lng, heading, speed, ...obdPayload }
  );
  return res.data;
};

// POST /driver/trips/:id/report_dtc
export const reportDtc = async (
  tripId: number,
  codes: string[]
): Promise<ApiResponse<{ reported: number }>> => {
  const res = await apiClient.post<ApiResponse<{ reported: number }>>(
    `/driver/trips/${tripId}/report_dtc`,
    { codes }
  );
  return res.data;
};
