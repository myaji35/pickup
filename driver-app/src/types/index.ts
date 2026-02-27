// ─────────────────────────────────────────
// Rails API 응답 기본 구조
// ─────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  current_page: number;
  total_pages: number;
  total_count: number;
  per_page: number;
}

// ─────────────────────────────────────────
// Auth
// ─────────────────────────────────────────
export interface User {
  id: number;
  email: string;
  name: string;
  role: 'super_admin' | 'institution_admin' | 'driver' | 'passenger';
  institution_id: number | null;
  phone: string | null;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  user: User;
}

// ─────────────────────────────────────────
// Trip (운행)
// ─────────────────────────────────────────
export type ShuttleType = 'morning' | 'evening' | 'temporary';
export type TripStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface Trip {
  id: number;
  trip_date: string;
  shuttle_type: ShuttleType;
  status: TripStatus;
  started_at: string | null;
  ended_at: string | null;
  current_lat: number | null;
  current_lng: number | null;
  location_updated_at: string | null;
  passengers_count: number;
}

export interface TripPassenger {
  check_in_id: number;
  passenger_id: number;
  name: string;
  phone: string | null;
  pickup_address: string;
  pickup_lat: number | null;
  pickup_lng: number | null;
  status: CheckInStatus;
  boarding_order: number | null;   // VRP 최적화 픽업 순서
  boarded_at: string | null;
  alighted_at: string | null;
}

export interface Vehicle {
  id: number;
  plate_number: string;
  plate_last4: string;
  current_lat: number | null;
  current_lng: number | null;
  heading: number | null;
  speed: number | null;
}

export interface TripDetail extends Trip {
  vehicle: Vehicle;
  passengers: TripPassenger[];
}

// ─────────────────────────────────────────
// CheckIn
// ─────────────────────────────────────────
export type CheckInStatus = 'pending' | 'boarded' | 'alighted' | 'absent';

export interface CheckInResult {
  id: number;
  status: CheckInStatus;
  boarded_at: string | null;
  alighted_at: string | null;
}

// ─────────────────────────────────────────
// GPS
// ─────────────────────────────────────────
export interface GpsLocation {
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
}

export interface LocationUpdate {
  type: 'location_update';
  trip_id: number;
  vehicle_id: number;
  plate_last4: string;
  lat: number;
  lng: number;
  heading: number | null;
  speed: number | null;
  status: TripStatus;
  updated_at: string;
}
