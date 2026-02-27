/**
 * Passenger App Types
 * Phase 12 - Option B: Minimal Passenger App
 */

// User & Auth Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'INSTITUTION_ADMIN' | 'DRIVER' | 'PASSENGER';
  institutionId?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// Trip Types
export interface Trip {
  id: string;
  type: 'MORNING' | 'EVENING' | 'TEMPORARY';
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  scheduledStart: string;
  actualStart?: string;
  actualEnd?: string;
  vehicleId: string;
  driverId: string;
  routeId?: string;
}

// Location Type
export interface Location {
  lat: number;
  lng: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}
