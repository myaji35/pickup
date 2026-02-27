# RiskIndexCalculatorService
# 기관의 종합 리스크 지수(0~100)를 가중 공식으로 산출
#
# ── 가중치 구성 ──
#   40% 안전 점수 평균  (높을수록 좋음 → 역수 변환)
#   30% 위험 이벤트 빈도  (운행 당 이벤트 수)
#   20% DTC 심각도   (critical=4, high=3, medium=2, low=1)
#   10% 예측 정비 상태  (overdue 부품 비율)
#
# ── 출력 ──
#   risk_index        : 0~100 (높을수록 위험)
#   risk_level        : LOW / MEDIUM / HIGH / CRITICAL
#   discount_rate_pct : 0~15.0 (보험료 할인율)
#   breakdown         : 요소별 기여 점수

class RiskIndexCalculatorService
  WEIGHTS = {
    safety_score:   0.40,
    event_rate:     0.30,
    dtc_severity:   0.20,
    maintenance:    0.10
  }.freeze

  RISK_LEVELS = {
    0..29  => 'LOW',
    30..49 => 'MEDIUM',
    50..74 => 'HIGH',
    75..100 => 'CRITICAL'
  }.freeze

  # 할인율 매핑 (risk_index → 할인율)
  # risk_index 0~29 → 15%, 30~49 → 10%, 50~74 → 5%, 75+ → 0%
  DISCOUNT_MAP = {
    0..29  => 15.0,
    30..49 => 10.0,
    50..74 => 5.0,
    75..100 => 0.0
  }.freeze

  def initialize(institution, period_start, period_end = nil)
    @institution  = institution
    @period_start = period_start
    @period_end   = period_end || period_start.end_of_month
  end

  def calculate
    trips     = scoped_trips
    events    = scoped_events(trips)
    drivers   = scoped_drivers(trips)
    dtc_list  = scoped_dtc(trips)
    preds     = scoped_predictions

    safety_component  = safety_score_component(drivers)
    event_component   = event_rate_component(events, trips)
    dtc_component     = dtc_severity_component(dtc_list)
    maint_component   = maintenance_component(preds)

    raw_index = (
      safety_component[:raw]  * WEIGHTS[:safety_score] +
      event_component[:raw]   * WEIGHTS[:event_rate] +
      dtc_component[:raw]     * WEIGHTS[:dtc_severity] +
      maint_component[:raw]   * WEIGHTS[:maintenance]
    ).round

    risk_index    = raw_index.clamp(0, 100)
    risk_level    = level_for(risk_index)
    discount_rate = discount_for(risk_index)

    {
      risk_index:        risk_index,
      risk_level:        risk_level,
      discount_rate_pct: discount_rate,
      breakdown: {
        safety_score:  safety_component,
        event_rate:    event_component,
        dtc_severity:  dtc_component,
        maintenance:   maint_component
      },
      meta: {
        total_trips:   trips.count,
        total_events:  events.count,
        total_dtc:     dtc_list.count,
        period_start:  @period_start.to_s,
        period_end:    @period_end.to_s
      }
    }
  end

  private

  # ──────────────────────────────────────────────
  # Data scoping
  # ──────────────────────────────────────────────

  def scoped_trips
    @institution.trips
                .where(status: :completed)
                .where(started_at: @period_start..@period_end)
  end

  def scoped_events(trips)
    DrivingEvent.where(trip_id: trips.pluck(:id))
  end

  def scoped_drivers(trips)
    driver_ids = trips.pluck(:driver_id).uniq.compact
    return DriverSafetyScore.none if driver_ids.empty?
    DriverSafetyScore
      .where(driver_id: driver_ids)
      .where(period_start: @period_start..@period_end)
  end

  def scoped_dtc(trips)
    vehicle_ids = trips.pluck(:vehicle_id).uniq.compact
    return DtcReport.none if vehicle_ids.empty?
    DtcReport
      .where(vehicle_id: vehicle_ids)
      .where(reported_at: @period_start..@period_end)
  end

  def scoped_predictions
    vehicle_ids = @institution.vehicles.pluck(:id)
    MaintenancePrediction.where(vehicle_id: vehicle_ids)
  end

  # ──────────────────────────────────────────────
  # Component calculators
  # ──────────────────────────────────────────────

  # 안전점수 컴포넌트 (0~100 리스크 값)
  # avg_score 100 → risk 0, avg_score 0 → risk 100
  def safety_score_component(drivers)
    if drivers.empty?
      return { raw: 50, score: nil, label: '데이터 없음' }
    end
    avg = drivers.average(:overall_score).to_f.round(1)
    raw = (100.0 - avg).clamp(0, 100).round
    { raw: raw, score: avg, label: "평균 안전점수 #{avg}점 → 위험 기여 #{raw}" }
  end

  # 이벤트 빈도 컴포넌트
  # 운행 당 이벤트 0개 → risk 0, 3개 이상 → risk 100
  def event_rate_component(events, trips)
    if trips.empty?
      return { raw: 0, rate: 0.0, label: '운행 없음' }
    end
    rate = events.count.to_f / trips.count
    raw  = (rate / 3.0 * 100.0).clamp(0, 100).round

    # 이벤트 유형별 가중 보정 (speeding × 1.5, harsh_braking × 1.2)
    severe_count = events.where(event_type: %w[speeding harsh_braking]).count
    severity_penalty = (severe_count.to_f / trips.count * 20).clamp(0, 20).round
    adjusted_raw = (raw + severity_penalty).clamp(0, 100)

    { raw: adjusted_raw, rate: rate.round(2), label: "운행당 이벤트 #{rate.round(2)}건 → 위험 기여 #{adjusted_raw}" }
  end

  # DTC 심각도 컴포넌트
  # critical DTC → 매 건당 +15, high → +8, medium → +3, low → +1 (합산, 100 cap)
  DTC_WEIGHTS = { 'critical' => 15, 'high' => 8, 'medium' => 3, 'low' => 1 }.freeze

  def dtc_severity_component(dtc_list)
    if dtc_list.empty?
      return { raw: 0, breakdown: {}, label: 'DTC 없음' }
    end
    breakdown = dtc_list.group(:severity).count
    raw = breakdown.sum { |sev, cnt| (DTC_WEIGHTS[sev] || 1) * cnt }
    raw = raw.clamp(0, 100)
    { raw: raw, breakdown: breakdown, label: "DTC 가중합 #{raw}" }
  end

  # 예측 정비 컴포넌트
  # overdue 비율 100% → risk 100
  def maintenance_component(preds)
    if preds.empty?
      return { raw: 0, overdue_count: 0, total: 0, label: '예측 데이터 없음' }
    end
    total    = preds.count
    overdue  = preds.where(status: 'overdue').count
    warning  = preds.where(status: 'warning').count
    raw = ((overdue * 2 + warning).to_f / (total * 2) * 100).clamp(0, 100).round

    { raw: raw, overdue_count: overdue, warning_count: warning, total: total,
      label: "연체 #{overdue}건 / 경고 #{warning}건 → 위험 기여 #{raw}" }
  end

  # ──────────────────────────────────────────────
  # Lookup helpers
  # ──────────────────────────────────────────────

  def level_for(index)
    RISK_LEVELS.find { |range, _| range.include?(index) }&.last || 'CRITICAL'
  end

  def discount_for(index)
    DISCOUNT_MAP.find { |range, _| range.include?(index) }&.last || 0.0
  end
end
