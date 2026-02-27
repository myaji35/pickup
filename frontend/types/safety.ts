/**
 * Safety Dashboard Types — Epic 7 Phase B
 * Rails API /api/v1/institutions/safety/* 응답 기준
 */

export interface DriverSafetyScore {
  driver_id: number;
  driver_name: string;
  total_score: number;
  rank: number;
  harsh_accel_count: number;
  harsh_brake_count: number;
  speeding_count: number;
  idling_count: number;
  total_trips: number;
  period_year: number;
  period_week: number;
  updated_at: string;
}

export interface SafetyScoresResponse {
  year: number;
  week: number;
  drivers: DriverSafetyScore[];
}

export interface DrivingEvent {
  id: number;
  event_type: 'harsh_accel' | 'harsh_brake' | 'speeding' | 'idling';
  speed: number;
  rpm: number;
  lat: number;
  lng: number;
  trip_id: number;
  driver: { id: number; name: string };
  occurred_at: string;
}

export interface SafetySummary {
  period_days: number;
  total_events: number;
  by_type: Record<string, number>;
  dtc_count: number;
  top_drivers: Array<{ driver_id: number; name: string; event_count: number }>;
  generated_at: string;
}

export interface DtcReport {
  id: number;
  code: string;
  status: 'pending' | 'acknowledged' | 'resolved';
  trip_id: number;
  vehicle: { id: number; plate_number: string };
  reported_at: string;
}
