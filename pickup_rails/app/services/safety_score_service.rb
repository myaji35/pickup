# 드라이버 안전 점수 산출 서비스
#
# 점수 공식 (100점 만점):
#   - 급가속   -3점/건
#   - 급제동   -5점/건
#   - 과속     -4점/건
#   - 공회전   -1점/건 (단, 3분 미만은 제외)
#   - 최저 0점
#
# 호출 시점: 운행 종료(Trip#end!) 후 백그라운드 업데이트
class SafetyScoreService
  DEDUCTIONS = {
    'harsh_accel' => 3,
    'harsh_brake' => 5,
    'speeding'    => 4,
    'idling'      => 1,
  }.freeze

  IDLING_MIN_SECONDS = 180  # 공회전 3분 이상만 감점

  def initialize(driver_id, institution_id, year: nil, week: nil)
    @driver_id      = driver_id
    @institution_id = institution_id
    now             = Time.current
    @year           = year || now.year
    @week           = week || now.strftime('%V').to_i
  end

  def call
    score_record = DriverSafetyScore.find_or_initialize_by(
      driver_id:      @driver_id,
      institution_id: @institution_id,
      period_year:    @year,
      period_week:    @week
    )

    counts = event_counts
    deduction = calculate_deduction(counts)

    score_record.assign_attributes(
      total_score:        [(100 - deduction), 0].max,
      harsh_accel_count:  counts['harsh_accel'],
      harsh_brake_count:  counts['harsh_brake'],
      speeding_count:     counts['speeding'],
      idling_count:       counts['idling'],
      total_trips:        trip_count,
    )
    score_record.save!

    # 기관 내 순위 재산출
    DriverSafetyScore.recalculate_ranks!(@institution_id, @year, @week)

    score_record
  end

  private

  def week_range
    # ISO 주차 시작(월요일) ~ 끝(일요일)
    jan4 = Date.new(@year, 1, 4)
    start_of_week1 = jan4 - jan4.cwday + 1
    week_start = start_of_week1 + (@week - 1) * 7
    week_start.beginning_of_day...(week_start + 7).beginning_of_day
  end

  def base_scope
    DrivingEvent
      .joins(trip: { roster: :institution })
      .where(driver_id: @driver_id)
      .where(created_at: week_range)
  end

  def event_counts
    counts = base_scope.group(:event_type).count
    # idling은 3분(180초) 이상만 카운트
    if counts['idling'].to_i > 0
      counts['idling'] = base_scope
        .where(event_type: 'idling')
        .where('duration_seconds >= ?', IDLING_MIN_SECONDS)
        .count
    end
    counts.tap { |c| %w[harsh_accel harsh_brake speeding idling].each { |t| c[t] ||= 0 } }
  end

  def calculate_deduction(counts)
    DEDUCTIONS.sum { |type, pts| counts[type].to_i * pts }
  end

  def trip_count
    Trip
      .joins(roster: :institution)
      .where(driver_id: @driver_id, rosters: { institution_id: @institution_id })
      .where(started_at: week_range)
      .count
  end
end
