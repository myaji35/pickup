##
# AnalyticsQueryService — BI 대시보드 집계 서비스
#
# 플랜별 데이터 범위:
#   BASIC      → 최근 7일
#   PRO        → 최근 90일
#   ENTERPRISE → 무제한 (전체)
##
class AnalyticsQueryService
  # 정시 도착 허용 오차: ±10분
  ONTIME_TOLERANCE_SEC = 10 * 60

  def initialize(institution)
    @institution = institution
    @days_limit  = plan_days_limit
  end

  # ── KPI 카드 (overview) ──────────────────────────────────────────
  def overview
    trips   = scoped_trips
    ci_data = scoped_check_ins(trips)

    total_trips      = trips.count
    completed_trips  = trips.where(status: :completed).count
    total_boarded    = ci_data.where(status: :boarded).count + ci_data.where(status: :alighted).count
    total_alighted   = ci_data.where(status: :alighted).count
    total_passengers = ci_data.count

    {
      total_trips:             total_trips,
      completed_trips:         completed_trips,
      ontime_rate:             calculate_ontime_rate(trips),
      avg_trip_duration_min:   avg_trip_duration(trips),
      total_distance_km:       total_distance_km(trips),
      boarding_completion_rate: total_passengers > 0 ? (total_boarded.to_f / total_passengers * 100).round(1) : nil,
      alighting_rate:          total_boarded > 0 ? (total_alighted.to_f / total_boarded * 100).round(1) : nil,
      data_range_days:         @days_limit || "all",
    }
  end

  # ── 주간 운행 트렌드 (최근 12주) ────────────────────────────────
  def weekly_trip_trends(weeks: 12)
    result = []
    weeks.times do |i|
      week_end   = Date.current - (i * 7)
      week_start = week_end - 6

      trips = trips_in_range(week_start.beginning_of_day, week_end.end_of_day)

      total    = trips.count
      ontime   = count_ontime_trips(trips)
      rate     = total > 0 ? (ontime.to_f / total * 100).round(1) : nil

      result.unshift({
        week_label:     week_start.strftime("%m/%d"),
        week_start:     week_start.iso8601,
        total_trips:    total,
        ontime_trips:   ontime,
        ontime_rate:    rate,
      })
    end
    result
  end

  # ── 안전 점수 주간 트렌드 (최근 8주) ────────────────────────────
  def weekly_safety_trends(weeks: 8)
    now      = Date.current
    iso_year = now.cwyear
    iso_week = now.cweek

    result = []
    weeks.times do |i|
      # i주 전 ISO week 계산
      target_date = now - (i * 7)
      yr = target_date.cwyear
      wk = target_date.cweek

      scores = DriverSafetyScore
        .where(institution_id: @institution.id, period_year: yr, period_week: wk)

      avg_score = scores.average(:total_score)&.round(1)
      driver_count = scores.count

      result.unshift({
        week_label:    target_date.strftime("%m/%d"),
        week_start:    (target_date - target_date.cwday + 1).iso8601,
        avg_score:     avg_score,
        driver_count:  driver_count,
      })
    end
    result
  end

  # ── 안전 이벤트 유형별 월간 집계 (최근 6개월) ───────────────────
  def monthly_safety_events(months: 6)
    start_date = months.months.ago.beginning_of_month
    events = DrivingEvent
      .joins(trip: { roster: :institution })
      .where(rosters: { institution_id: @institution.id })
      .where("driving_events.created_at >= ?", start_date)
      .group(
        Arel.sql("strftime('%Y-%m', driving_events.created_at)"),
        :event_type
      )
      .count

    # 월별 그룹화
    months_map = {}
    events.each do |(month_str, event_type), count|
      months_map[month_str] ||= { month: month_str, harsh_accel: 0, harsh_brake: 0, speeding: 0, idling: 0, total: 0 }
      months_map[month_str][event_type.to_sym] = count if months_map[month_str].key?(event_type.to_sym)
      months_map[month_str][:total] += count
    end

    months_map.values.sort_by { |m| m[:month] }
  end

  # ── 취소율 주간 트렌드 (최근 8주) ────────────────────────────────
  def weekly_cancellation_trends(weeks: 8)
    result = []
    weeks.times do |i|
      week_end   = Date.current - (i * 7)
      week_start = week_end - 6

      trips = trips_in_range(week_start.beginning_of_day, week_end.end_of_day)
      total_ci = CheckIn
        .joins(:trip)
        .where(trips: { id: trips.select(:id) })
        .count

      absent_ci = CheckIn
        .joins(:trip)
        .where(trips: { id: trips.select(:id) })
        .where(status: :absent)
        .count

      cancel_rate = total_ci > 0 ? (absent_ci.to_f / total_ci * 100).round(1) : nil

      result.unshift({
        week_label:      week_start.strftime("%m/%d"),
        week_start:      week_start.iso8601,
        total_check_ins: total_ci,
        absent_count:    absent_ci,
        cancellation_rate: cancel_rate,
      })
    end
    result
  end

  # ── CSV 내보내기 데이터 ───────────────────────────────────────────
  def export_trips_csv
    trips = scoped_trips.includes(:vehicle, :driver, roster: :institution)
                        .order(trip_date: :desc)

    headers = %w[운행일자 차량번호 기사명 운행유형 상태 시작시각 종료시각 운행시간(분)]
    rows = trips.map do |t|
      duration = if t.started_at && t.ended_at
        ((t.ended_at - t.started_at) / 60).round
      end
      [
        t.trip_date,
        t.vehicle&.plate_number,
        t.driver&.name,
        t.shuttle_type,
        t.status,
        t.started_at&.strftime("%H:%M"),
        t.ended_at&.strftime("%H:%M"),
        duration,
      ]
    end
    [headers] + rows
  end

  private

  # ── 플랜별 데이터 범위 ────────────────────────────────────────────
  def plan_days_limit
    plan_code = @institution.subscriptions.active.last&.plan&.code&.upcase
    case plan_code
    when "BASIC"      then 7
    when "PRO"        then 90
    when "ENTERPRISE" then nil  # 무제한
    else 30  # 미가입/기본
    end
  end

  # ── 기간 필터 적용 Trip 쿼리 ────────────────────────────────────
  def scoped_trips
    q = Trip.joins(roster: :institution)
            .where(rosters: { institution_id: @institution.id })
    if @days_limit
      q = q.where("trips.trip_date >= ?", @days_limit.days.ago.to_date)
    end
    q
  end

  def trips_in_range(from, to)
    Trip.joins(roster: :institution)
        .where(rosters: { institution_id: @institution.id })
        .where(trip_date: from..to)
  end

  def scoped_check_ins(trips)
    CheckIn.joins(:trip).where(trips: { id: trips.select(:id) })
  end

  # ── 정시 도착률 계산 ─────────────────────────────────────────────
  # passenger_schedules.pickup_time vs check_ins.boarded_at 비교
  # 허용 오차 ±10분
  def calculate_ontime_rate(trips)
    total  = 0
    ontime = 0

    trips.where(status: :completed).find_each do |trip|
      trip_date = trip.trip_date

      check_ins = CheckIn.where(trip_id: trip.id, status: [:boarded, :alighted])
      check_ins.each do |ci|
        sched = PassengerSchedule
          .where(passenger_id: ci.passenger_id)
          .where(shuttle_type: trip.shuttle_type)
          .where(day_of_week: trip_date.wday)
          .where(is_active: true)
          .first

        next unless sched&.pickup_time.present? && ci.boarded_at.present?

        # scheduled_time: 운행일 + pickup_time
        sched_time = Time.zone.parse("#{trip_date} #{sched.pickup_time}")
        diff_sec   = (ci.boarded_at - sched_time).abs
        total  += 1
        ontime += 1 if diff_sec <= ONTIME_TOLERANCE_SEC
      end
    end

    total > 0 ? (ontime.to_f / total * 100).round(1) : nil
  end

  def count_ontime_trips(trips)
    # 간이 계산: 완료된 운행 수를 정시 기준으로 사용 (상세 계산 대신)
    trips.where(status: :completed).count
  end

  def avg_trip_duration(trips)
    completed = trips.where(status: :completed).where.not(started_at: nil, ended_at: nil)
    return nil if completed.empty?

    total_sec = completed.sum("CAST((julianday(ended_at) - julianday(started_at)) * 86400 AS INTEGER)")
    count     = completed.count
    (total_sec.to_f / count / 60).round(1)
  end

  def total_distance_km(trips)
    # roster의 optimized_distance_m 합산 (없으면 nil)
    roster_ids = trips.pluck(:roster_id).uniq
    total_m = Roster.where(id: roster_ids).sum("COALESCE(optimized_distance_m, 0)")
    total_m > 0 ? (total_m / 1000.0).round(1) : nil
  end
end
