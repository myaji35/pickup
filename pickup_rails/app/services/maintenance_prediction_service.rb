# MaintenancePredictionService
# 규칙 기반 부품 수명 예측 엔진
#
# 예측 로직:
#   - brake_pads:  기본 60,000km / 최근 harsh_braking 이벤트 빈도로 -최대 30% 보정
#   - engine_oil:  기본 10,000km 또는 365일 (둘 중 먼저 도달)
#   - tires:       기본 40,000km / 과속 이벤트 빈도로 -최대 20% 보정
#   - air_filter:  기본 20,000km
#   - battery:     최근 DTC P0562/P0563(저전압) 기반 - 이벤트 있으면 90일, 없으면 365일

class MaintenancePredictionService
  # 부품별 기본 수명 (km)
  BASE_LIFE_KM = {
    brake_pads: 60_000,
    engine_oil: 10_000,
    tires:      40_000,
    air_filter: 20_000
  }.freeze

  # 부품별 기본 수명 (일) — km와 병행 추적
  BASE_LIFE_DAYS = {
    brake_pads: 730,   # 2년
    engine_oil: 365,   # 1년
    tires:      1095,  # 3년
    air_filter: 730,   # 2년
    battery:    365    # 1년
  }.freeze

  # 상태 임계값 (잔여 km 또는 잔여 일)
  WARNING_KM_THRESHOLD  = 5_000
  OVERDUE_KM_THRESHOLD  = 0
  WARNING_DAY_THRESHOLD = 30
  OVERDUE_DAY_THRESHOLD = 0

  def initialize(vehicle)
    @vehicle = vehicle
  end

  # 전체 부품 예측 갱신 (upsert)
  def predict_all!
    results = {}
    MaintenancePrediction::COMPONENTS.each do |component|
      results[component] = predict_component!(component)
    end
    results
  end

  # 개별 부품 예측
  def predict_component!(component)
    data = send(:"predict_#{component}")
    upsert_prediction(component, data)
  end

  private

  # ───────────────────────────────────────────
  # 브레이크 패드 예측
  # ───────────────────────────────────────────
  def predict_brake_pads
    # 최근 30일 harsh_braking 이벤트 수
    harsh_count = DrivingEvent
      .joins(:trip)
      .where(trips: { vehicle_id: @vehicle.id })
      .where(event_type: 'harsh_braking')
      .where(created_at: 30.days.ago..)
      .count

    # 과다 급제동 시 수명 단축 (최대 30%)
    penalty = [ harsh_count * 0.005, 0.30 ].min
    effective_life_km = (BASE_LIFE_KM[:brake_pads] * (1 - penalty)).to_i

    last_record = last_maintenance(@vehicle, 'brake_pads')
    mileage_since = mileage_since_last_service(last_record)
    remaining_km  = [ effective_life_km - mileage_since, 0 ].max

    days_driven    = days_since_last_service(last_record)
    remaining_days = [ BASE_LIFE_DAYS[:brake_pads] - days_driven, 0 ].max

    confidence = calculate_confidence(mileage_since, effective_life_km)
    status     = determine_status(remaining_km, remaining_days)
    due_date   = predict_due_date(remaining_km, remaining_days)
    basis      = "기본 #{(BASE_LIFE_KM[:brake_pads] / 1000).round}천km 수명, " \
                 "급제동 #{harsh_count}회 → 조정 #{(penalty * 100).round}% 감소"

    build_result(remaining_km, remaining_days, due_date, status, confidence, basis)
  end

  # ───────────────────────────────────────────
  # 엔진 오일 예측
  # ───────────────────────────────────────────
  def predict_engine_oil
    last_record = last_maintenance(@vehicle, 'engine_oil')
    mileage_since = mileage_since_last_service(last_record)
    days_driven   = days_since_last_service(last_record)

    remaining_km   = [ BASE_LIFE_KM[:engine_oil] - mileage_since, 0 ].max
    remaining_days = [ BASE_LIFE_DAYS[:engine_oil] - days_driven, 0 ].max

    # 엔진 관련 DTC 있으면 신뢰도 낮춤
    engine_dtc_count = recent_dtc_count('engine')
    confidence = [ calculate_confidence(mileage_since, BASE_LIFE_KM[:engine_oil]) - engine_dtc_count * 5, 30 ].max

    status   = determine_status(remaining_km, remaining_days)
    due_date = predict_due_date(remaining_km, remaining_days)
    basis    = "기본 #{BASE_LIFE_KM[:engine_oil] / 1000}천km / #{BASE_LIFE_DAYS[:engine_oil]}일 중 빠른 시점"
    basis   += ", 엔진 DTC #{engine_dtc_count}건" if engine_dtc_count > 0

    build_result(remaining_km, remaining_days, due_date, status, confidence, basis)
  end

  # ───────────────────────────────────────────
  # 타이어 예측
  # ───────────────────────────────────────────
  def predict_tires
    # 최근 30일 speeding 이벤트
    speeding_count = DrivingEvent
      .joins(:trip)
      .where(trips: { vehicle_id: @vehicle.id })
      .where(event_type: 'speeding')
      .where(created_at: 30.days.ago..)
      .count

    penalty = [ speeding_count * 0.003, 0.20 ].min
    effective_life_km = (BASE_LIFE_KM[:tires] * (1 - penalty)).to_i

    last_record   = last_maintenance(@vehicle, 'tires')
    mileage_since = mileage_since_last_service(last_record)
    days_driven   = days_since_last_service(last_record)

    remaining_km   = [ effective_life_km - mileage_since, 0 ].max
    remaining_days = [ BASE_LIFE_DAYS[:tires] - days_driven, 0 ].max

    confidence = calculate_confidence(mileage_since, effective_life_km)
    status     = determine_status(remaining_km, remaining_days)
    due_date   = predict_due_date(remaining_km, remaining_days)
    basis      = "기본 #{BASE_LIFE_KM[:tires] / 1000}천km 수명, " \
                 "과속 #{speeding_count}회 → #{(penalty * 100).round}% 단축 적용"

    build_result(remaining_km, remaining_days, due_date, status, confidence, basis)
  end

  # ───────────────────────────────────────────
  # 에어 필터 예측
  # ───────────────────────────────────────────
  def predict_air_filter
    last_record   = last_maintenance(@vehicle, 'air_filter')
    mileage_since = mileage_since_last_service(last_record)
    days_driven   = days_since_last_service(last_record)

    remaining_km   = [ BASE_LIFE_KM[:air_filter] - mileage_since, 0 ].max
    remaining_days = [ BASE_LIFE_DAYS[:air_filter] - days_driven, 0 ].max

    confidence = calculate_confidence(mileage_since, BASE_LIFE_KM[:air_filter])
    status     = determine_status(remaining_km, remaining_days)
    due_date   = predict_due_date(remaining_km, remaining_days)
    basis      = "기본 #{BASE_LIFE_KM[:air_filter] / 1000}천km / #{BASE_LIFE_DAYS[:air_filter]}일"

    build_result(remaining_km, remaining_days, due_date, status, confidence, basis)
  end

  # ───────────────────────────────────────────
  # 배터리 예측 (DTC P0562/P0563 기반)
  # ───────────────────────────────────────────
  def predict_battery
    battery_dtc_count = DtcReport
      .joins(:vehicle)
      .where(vehicle_id: @vehicle.id)
      .where("code LIKE 'P056%'")
      .where(created_at: 90.days.ago..)
      .count

    if battery_dtc_count > 0
      remaining_days = [ 90 - battery_dtc_count * 10, 7 ].max
      confidence     = 70
      basis          = "배터리 저전압 DTC #{battery_dtc_count}건 감지 → 긴급 점검 권장"
      status         = battery_dtc_count >= 3 ? 'overdue' : 'warning'
    else
      last_record    = last_maintenance(@vehicle, 'battery')
      days_driven    = days_since_last_service(last_record)
      remaining_days = [ BASE_LIFE_DAYS[:battery] - days_driven, 0 ].max
      confidence     = 55
      basis          = "기본 #{BASE_LIFE_DAYS[:battery]}일 수명 기준 (DTC 없음)"
      status         = determine_status(99_999, remaining_days)
    end

    due_date = Date.today + remaining_days
    build_result(nil, remaining_days, due_date, status, confidence, basis)
  end

  # ───────────────────────────────────────────
  # Helper methods
  # ───────────────────────────────────────────

  def last_maintenance(vehicle, component)
    MaintenanceRecord
      .where(vehicle: vehicle, component: component)
      .order(performed_on: :desc)
      .first
  end

  def mileage_since_last_service(record)
    return @vehicle.current_mileage_km || 0 if record.nil?
    current = @vehicle.current_mileage_km || 0
    last    = record.mileage_km || 0
    [ current - last, 0 ].max
  end

  def days_since_last_service(record)
    return 0 if record.nil?
    (Date.today - record.performed_on).to_i
  end

  def recent_dtc_count(category)
    DtcReport
      .joins(:vehicle)
      .where(vehicle_id: @vehicle.id)
      .where(created_at: 30.days.ago..)
      .count
  end

  def calculate_confidence(used, total)
    return 90 if total.zero?
    ratio = used.to_f / total
    # 사용률 50% 이하: 90%, 80% 이상: 60%, 그 사이 선형 보간
    if ratio <= 0.5
      90
    elsif ratio >= 0.8
      60
    else
      (90 - (ratio - 0.5) * 100).round
    end
  end

  def determine_status(remaining_km, remaining_days)
    if remaining_km <= OVERDUE_KM_THRESHOLD || remaining_days <= OVERDUE_DAY_THRESHOLD
      'overdue'
    elsif remaining_km <= WARNING_KM_THRESHOLD || remaining_days <= WARNING_DAY_THRESHOLD
      'warning'
    else
      'ok'
    end
  end

  def predict_due_date(remaining_km, remaining_days)
    # 남은 거리를 일 수로 환산 (일평균 100km 가정)
    avg_daily_km = 100
    km_days = remaining_km.present? && remaining_km > 0 ? remaining_km / avg_daily_km : 999

    days_to_service = [ km_days, remaining_days ].min
    Date.today + days_to_service.days
  end

  def build_result(remaining_km, remaining_days, due_date, status, confidence, basis)
    {
      remaining_km:       remaining_km,
      remaining_days:     remaining_days,
      predicted_due_date: due_date,
      status:             status,
      confidence_pct:     confidence,
      basis:              basis,
      last_predicted_at:  Time.current
    }
  end

  def upsert_prediction(component, data)
    pred = MaintenancePrediction.find_or_initialize_by(
      vehicle: @vehicle,
      component: component
    )
    pred.assign_attributes(data)
    pred.save!
    pred
  end
end
