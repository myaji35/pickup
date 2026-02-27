/**
 * Passenger App Types — Epic 8
 * Rails 8.1.2 API 응답 형식 기준
 */

// ─── Auth ───────────────────────────────────────────────────
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'super_admin' | 'institution_admin' | 'driver' | 'passenger';
  passenger?: {
    id: number;
    name: string;
  };
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

// ─── Trip ───────────────────────────────────────────────────
export interface Trip {
  id: number;
  trip_date: string;           // 'YYYY-MM-DD'
  shuttle_type: 'morning' | 'evening' | 'temporary';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  vehicle: { id: number; plate_number: string | null };
  driver:  { id: number; name: string | null };
  started_at: string | null;
  ended_at:   string | null;
  cancelled:  boolean;
}

export interface ActiveTrip extends Trip {
  current_lat:    number | null;
  current_lng:    number | null;
  current_speed:  number | null;
  gps_updated_at: string | null;
  eta_minutes:    number | null;
}

// ─── Profile ─────────────────────────────────────────────────
export interface PassengerInfo {
  id: number;
  name: string;
  relationship: string;
  invite_code: string;
}

export interface GuardianProfile {
  id: number;
  name: string;
  email: string;
  passengers: PassengerInfo[];
}

// ─── API ─────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
