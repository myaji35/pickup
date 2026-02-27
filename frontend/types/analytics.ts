/**
 * Analytics Types — Epic 10 BI 대시보드
 */

// ─── KPI 개요 ─────────────────────────────────────────────────────
export interface AnalyticsOverview {
  total_trips: number;
  completed_trips: number;
  ontime_rate: number | null;              // %
  avg_trip_duration_min: number | null;    // 분
  total_distance_km: number | null;        // km
  boarding_completion_rate: number | null; // %
  alighting_rate: number | null;           // %
  data_range_days: number | 'all';
}

// ─── 주간 운행 트렌드 ─────────────────────────────────────────────
export interface WeeklyTripTrend {
  week_label: string;     // "MM/DD"
  week_start: string;     // ISO date
  total_trips: number;
  ontime_trips: number;
  ontime_rate: number | null;
}

export interface TripTrendsResponse {
  weekly_trends: WeeklyTripTrend[];
}

// ─── 안전 점수 트렌드 ─────────────────────────────────────────────
export interface WeeklySafetyScore {
  week_label: string;
  week_start: string;
  avg_score: number | null;
  driver_count: number;
}

export interface MonthlySafetyEvent {
  month: string;           // "YYYY-MM"
  harsh_accel: number;
  harsh_brake: number;
  speeding: number;
  idling: number;
  total: number;
}

export interface SafetyAnalyticsResponse {
  weekly_scores: WeeklySafetyScore[];
  monthly_events: MonthlySafetyEvent[];
}

// ─── 취소율 트렌드 ────────────────────────────────────────────────
export interface WeeklyCancellation {
  week_label: string;
  week_start: string;
  total_check_ins: number;
  absent_count: number;
  cancellation_rate: number | null;
}

export interface PassengerAnalyticsResponse {
  weekly_cancellations: WeeklyCancellation[];
}
