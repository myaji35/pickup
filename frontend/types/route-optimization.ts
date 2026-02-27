/**
 * Route Optimization Types — Epic 9
 * AI 경로 최적화 관련 타입 정의
 */

// ─── 최적화된 승객 정보 ──────────────────────────────────────────
export interface OptimizedPassenger {
  id: number;                    // roster_passenger.id
  passenger_id: number;
  name: string;
  pickup_address: string;
  lat: number;
  lng: number;
  boarding_order: number;
  estimated_arrival_sec: number;
  cumulative_distance_m: number;
}

// ─── 최적화 결과 (VRP 서버 응답) ────────────────────────────────
export interface OptimizationResult {
  roster_id: number;
  optimized_passengers: OptimizedPassenger[];
  total_distance_m: number;
  total_duration_sec: number;
  total_distance_km: number;
  total_duration_min: number;
  solver_status: string;
  distance_source: 'kakao' | 'haversine';
}

// ─── 절감 효과 ─────────────────────────────────────────────────
export interface OptimizationSavings {
  saved_distance_m: number;
  saved_distance_km: number;
  saved_fuel_cost_krw: number;
  optimization_rate: number;
}

// ─── 경로 미리보기 (현재 DB 저장 순서) ─────────────────────────
export interface RoutePreviewPassenger {
  id: number;
  passenger_id: number;
  name: string;
  boarding_order: number | null;
  pickup_address: string;
  lat: number;
  lng: number;
  estimated_arrival_sec: number | null;
  cumulative_distance_m: number | null;
}

export interface RoutePreviewResponse {
  roster_id: number;
  last_optimized_at: string | null;
  total_distance_m: number | null;
  total_duration_sec: number | null;
  total_distance_km: number | null;
  total_duration_min: number | null;
  distance_source: 'kakao' | 'haversine' | null;
  passengers: RoutePreviewPassenger[];
  savings: OptimizationSavings | null;
}

// ─── 최적화 적용 요청 ────────────────────────────────────────────
export interface ApplyOptimizationRequest {
  optimized_passengers: OptimizedPassenger[];
  total_distance_m: number;
  total_duration_sec: number;
  distance_source: string;
}

// ─── 최적화 적용 응답 ────────────────────────────────────────────
export interface ApplyOptimizationResponse {
  message: string;
  roster_id: number;
  optimized_distance_m: number;
  saved_distance_m: number;
  saved_fuel_cost_krw: number;
}
