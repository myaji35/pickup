##
# InsuranceSafetyReportService — 보험사용 안전 리포트 생성
#
# 개인정보 보호:
#   - 드라이버 이름/연락처 미포함 (driver_id만 제공)
#   - 차량 번호판 마스킹 (마지막 4자리만)
#   - 개인정보보호법 준수
##
class InsuranceSafetyReportService
  def initialize(institution, month_start)
    @institution  = institution
    @month_start  = month_start
    @month_end    = month_start.end_of_month
  end

  def generate
    trips   = scoped_trips
    drivers = scoped_drivers(trips)
    events  = scoped_events(trips)

    # 고도화된 리스크 지수 (RiskIndexCalculatorService)
    risk_data = RiskIndexCalculatorService.new(@institution, @month_start, @month_end).calculate

    {
      institution_id:          @institution.id,
      institution_name:        @institution.name,
      period:                  @month_start.strftime("%Y-%m"),
      generated_at:            Time.current.iso8601,
      risk_index:              risk_data[:risk_index],
      risk_level:              risk_data[:risk_level],
      insurance_discount_rate: risk_data[:discount_rate_pct],
      risk_breakdown:          risk_data[:breakdown],
      summary: {
        total_trips:          trips.count,
        total_distance_km:    trips.sum(:distance_km).to_f.round(1),
        total_driving_events: events.count,
        avg_safety_score:     avg_safety_score(drivers),
        meta:                 risk_data[:meta],
      },
      drivers:  driver_reports(drivers, events),
      vehicles: vehicle_reports(trips),
    }
  end

  private

  def scoped_trips
    @institution.trips
                .where(status: :completed)
                .where(started_at: @month_start..@month_end)
                .includes(:vehicle)
  end

  def scoped_drivers(trips)
    driver_ids = trips.pluck(:driver_id).uniq.compact
    start_w = @month_start.to_date.cweek
    end_w   = @month_end.to_date.cweek
    year    = @month_start.to_date.year
    DriverSafetyScore
      .where(driver_id: driver_ids)
      .where(period_year: year, period_week: start_w..end_w)
      .includes(:driver)
  end

  def scoped_events(trips)
    trip_ids = trips.pluck(:id)
    DrivingEvent.where(trip_id: trip_ids)
  end

  def calculate_risk_index(drivers)
    return "N/A" if drivers.empty?
    avg = drivers.average(:total_score).to_f
    case avg
    when 90..100 then "LOW"
    when 70...90 then "MEDIUM"
    when 50...70 then "HIGH"
    else              "VERY_HIGH"
    end
  end

  def calculate_discount_rate(drivers)
    return 0.0 if drivers.empty?
    avg = drivers.average(:total_score).to_f
    # 안전점수 기준 최대 15% 할인
    [((avg - 50.0) / 50.0 * 15.0).round(1), 0.0].max
  end

  def avg_safety_score(drivers)
    return nil if drivers.empty?
    drivers.average(:total_score).to_f.round(1)
  end

  def driver_reports(drivers, events)
    drivers.map do |score|
      driver_events = events.select { |e| e.trip&.driver_id == score.driver_id }
      {
        driver_id:      score.driver_id,           # 익명 식별자 (이름 미포함)
        safety_score:   score.total_score,
        grade:          score.grade,
        event_summary: {
          harsh_acceleration: driver_events.count { |e| e.event_type == "harsh_acceleration" },
          harsh_braking:      driver_events.count { |e| e.event_type == "harsh_braking" },
          speeding:           driver_events.count { |e| e.event_type == "speeding" },
          total:              driver_events.size,
        },
      }
    end
  end

  def vehicle_reports(trips)
    trips.group_by(&:vehicle_id).map do |vehicle_id, v_trips|
      vehicle = v_trips.first.vehicle
      dtc_count = DtcReport.where(vehicle_id: vehicle_id)
                           .where(reported_at: @month_start..@month_end)
                           .count
      {
        vehicle_id:        vehicle_id,
        plate_last4:       vehicle.plate_last4,        # 번호판 뒷 4자리만
        mileage_km:        v_trips.sum(&:distance_km).to_f.round(1),
        trip_count:        v_trips.size,
        dtc_summary: {
          total_codes:    dtc_count,
          severity_breakdown: dtc_severity_breakdown(vehicle_id),
        },
      }
    end
  end

  def dtc_severity_breakdown(vehicle_id)
    DtcReport
      .where(vehicle_id: vehicle_id)
      .where(reported_at: @month_start..@month_end)
      .group(:severity)
      .count
  end
end
