/**
 * Driver App Types (Phase 12.3)
 *
 * Backend API와 매칭되는 TypeScript 타입 정의
 */

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    access_token: string;
    user: User;
  };
  message?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'INSTITUTION_ADMIN' | 'DRIVER';
  institutionId: string | null;
}

// Trip Types
export enum TripType {
  MORNING = 'MORNING',
  EVENING = 'EVENING',
  TEMPORARY = 'TEMPORARY',
}

export enum TripStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface GpsLocation {
  lat: number;
  lng: number;
}

export interface Trip {
  id: string;
  institutionId: string;
  vehicleId: string;
  driverId: string;
  routeId: string | null;
  type: TripType;
  status: TripStatus;
  scheduledStart: string;
  actualStart: string | null;
  actualEnd: string | null;
  startLocation: GpsLocation | null;
  endLocation: GpsLocation | null;
  createdAt: string;
  updatedAt: string;
}

// CheckIn Types
export enum CheckInType {
  BOARDING = 'BOARDING',
  ALIGHTING = 'ALIGHTING',
}

export interface CheckIn {
  id: string;
  tripId: string;
  passengerId: string;
  type: CheckInType;
  timestamp: string;
  location: GpsLocation;
  createdAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface TripDetailResponse {
  trip: Trip;
  checkIns: CheckIn[];
  stats: {
    totalCheckIns: number;
    boardingCount: number;
    alightingCount: number;
  };
}

// Request Types
export interface StartTripRequest {
  startLocation: GpsLocation;
}

export interface EndTripRequest {
  endLocation: GpsLocation;
}

export interface CreateCheckInRequest {
  tripId: string;
  passengerId: string;
  type: CheckInType;
  timestamp: string;
  location: GpsLocation;
}
