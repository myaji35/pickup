# DriverCoachingService
# 운행 이벤트 기반 실시간 코칭 메시지 생성 + 배지 평가
#
# 트리거 시점:
#   - trip 완료 시 → 운행 요약 코칭
#   - 이벤트 발생 시 → 즉각 피드백 (harsh_braking 3회 이상)
#   - 주간 요약 Job에서 → WeeklyCoachingSummary 생성

class DriverCoachingService
  # 코칭 메시지 풀 (이벤트 유형별 다양한 메시지)
  COACHING_TEMPLATES = {
    harsh_braking: {
      tip:     [
        '앞 차와의 안전 거리를 확보하면 급제동을 줄일 수 있어요.',
        '속도를 미리 예측하고 서서히 줄이는 습관을 키워보세요.',
        '급제동은 연료 소모와 타이어 마모를 증가시킵니다.'
      ],
      warning: [
        '이번 운행에서 급제동이 많았습니다. 승객 안전을 위해 주의해 주세요.',
        '급제동 횟수가 많아 안전 점수에 영향을 미쳤습니다.'
      ]
    },
    harsh_acceleration: {
      tip:     [
        '부드러운 출발이 연료 효율을 높이고 승차감을 개선합니다.',
        '엑셀을 천천히 밟는 습관이 엔진 수명을 늘려줍니다.'
      ],
      warning: [
        '급출발이 반복되고 있습니다. 안전 운전에 유의해 주세요.'
      ]
    },
    speeding: {
      warning: [
        '제한 속도를 초과한 구간이 있었습니다. 안전을 위해 속도를 준수해 주세요.',
        '과속은 사고 위험을 크게 높입니다. 승객 안전을 최우선으로 생각해 주세요.'
      ]
    },
    dtc_alert: {
      warning: [
        '차량 이상 경고가 감지되었습니다. 즉시 점검 후 운행하세요.',
        'OBD 경고등이 켜졌습니다. 정비소 방문을 권장합니다.'
      ]
    },
    trip_completed: {
      praise: [
        '이번 운행을 안전하게 완료했습니다. 수고하셨습니다! 🎉',
        '승객을 안전하게 모셨습니다. 좋은 하루 되세요! ✨'
      ],
      tip: [
        '꾸준한 안전 운전이 최고의 드라이버를 만듭니다.',
        '오늘도 안전 운전 감사합니다. 내일도 파이팅!'
      ]
    }
  }.freeze

  def initialize(driver)
    @driver = driver
  end

  # 운행 완료 시 코칭 메시지 생성
  def generate_post_trip_coaching(trip)
    events = trip.driving_events
    messages = []

    # 급제동 횟수 체크
    brake_count = events.count { |e| e.event_type == 'harsh_braking' }
    if brake_count >= 3
      msg = create_message(
        trip:          trip,
        trigger_event: 'harsh_braking',
        message_type:  'warning',
        severity:      brake_count >= 5 ? 'critical' : 'warning',
        template_pool: COACHING_TEMPLATES.dig(:harsh_braking, :warning)
      )
      messages << msg if msg
    elsif brake_count >= 1
      msg = create_message(
        trip:          trip,
        trigger_event: 'harsh_braking',
        message_type:  'tip',
        severity:      'info',
        template_pool: COACHING_TEMPLATES.dig(:harsh_braking, :tip)
      )
      messages << msg if msg
    end

    # 과속 체크
    speeding_count = events.count { |e| e.event_type == 'speeding' }
    if speeding_count > 0
      msg = create_message(
        trip:          trip,
        trigger_event: 'speeding',
        message_type:  'warning',
        severity:      speeding_count >= 3 ? 'critical' : 'warning',
        template_pool: COACHING_TEMPLATES.dig(:speeding, :warning)
      )
      messages << msg if msg
    end

    # 무사고 운행 칭찬
    if brake_count == 0 && speeding_count == 0 && events.empty?
      msg = create_message(
        trip:          trip,
        trigger_event: 'trip_completed',
        message_type:  'praise',
        severity:      'info',
        template_pool: COACHING_TEMPLATES.dig(:trip_completed, :praise)
      )
      messages << msg if msg
    end

    # 배지 평가
    evaluate_badges(trip)

    # FCM 발송 (미읽음 코칭 있을 때만)
    send_coaching_fcm if messages.any? { |m| m.severity == 'critical' }

    messages
  end

  # 실시간 이벤트 기반 즉각 코칭 (harsh_braking 감지 즉시 호출)
  def instant_coaching(trip, event_type)
    template_key = event_type.to_sym
    return nil unless COACHING_TEMPLATES[template_key]

    pool_key = :warning
    pool     = COACHING_TEMPLATES.dig(template_key, pool_key) ||
               COACHING_TEMPLATES.dig(template_key, :tip)
    return nil if pool.nil?

    create_message(
      trip:          trip,
      trigger_event: event_type,
      message_type:  pool_key.to_s,
      severity:      'warning',
      template_pool: pool
    )
  end

  # 주간 코칭 요약 생성
  def generate_weekly_summary(week_start = Date.today.beginning_of_week)
    week_end    = week_start.end_of_week
    week_trips  = @driver.trips.where(status: :completed, started_at: week_start..week_end)
    events      = DrivingEvent.where(trip_id: week_trips.pluck(:id))

    # 안전 점수 평균
    score = DriverSafetyScore.where(driver: @driver, period_year: week_start.year, period_week: week_start.cweek)
                             .average(:total_score).to_f.round(1)

    brake_count    = events.where(event_type: 'harsh_braking').count
    speeding_count = events.where(event_type: 'speeding').count
    badges_earned  = @driver.driver_badges.where(earned_on: week_start..week_end).count

    improvement_tips = []
    improvement_tips << '급제동을 줄이기 위해 앞 차와의 거리를 충분히 확보하세요.' if brake_count >= 5
    improvement_tips << '과속 운전을 자제하고 제한 속도를 항상 준수하세요.' if speeding_count >= 3
    improvement_tips << '출발 전 차량 상태를 확인하는 습관을 가지세요.' if week_trips.count > 5

    praise_points = []
    praise_points << "이번 주 #{week_trips.count}회 운행을 완료했습니다." if week_trips.count > 0
    praise_points << "안전 점수 #{score}점을 기록했습니다." if score > 80
    praise_points << "이번 주 #{badges_earned}개의 배지를 획득했습니다! 🏅" if badges_earned > 0

    summary = WeeklyCoachingSummary.find_or_initialize_by(
      driver: @driver, week_start: week_start
    )
    summary.update!(
      total_trips:      week_trips.count,
      total_events:     events.count,
      avg_score:        score,
      badges_earned:    badges_earned,
      improvement_tips: improvement_tips.to_json,
      praise_points:    praise_points.to_json
    )

    # 요약 코칭 메시지 생성
    content = "이번 주 운행 요약: #{week_trips.count}회 운행, " \
              "안전점수 #{score}점, 이벤트 #{events.count}건"
    CoachingMessage.create!(
      driver:        @driver,
      trigger_event: 'weekly_summary',
      message_type:  'summary',
      severity:      'info',
      content:       content
    )

    summary
  end

  # 배지 평가 (trip 완료 시)
  def evaluate_badges(trip)
    awarded = []

    # 안전 드라이버: 이번 운행 이벤트 0건
    if trip.driving_events.empty?
      award_badge('safe_driver', 'bronze', { trip_id: trip.id, events: 0 }) do
        true
      end
    end

    # 부드러운 제동: 30일간 harsh_braking < 5건
    month_brake = DrivingEvent
      .joins(:trip)
      .where(trips: { driver_id: @driver.id })
      .where(event_type: 'harsh_braking')
      .where(created_at: 30.days.ago..)
      .count

    if month_brake < 5
      level = month_brake == 0 ? 'gold' : 'silver'
      award_badge('smooth_braker', level, { month_brake_count: month_brake })
    end

    # 과속 없음: 이번 운행 speeding 0건
    if trip.driving_events.where(event_type: 'speeding').empty?
      award_badge('no_speeding', 'bronze', { trip_id: trip.id })
    end

    awarded
  end

  private

  def create_message(trip:, trigger_event:, message_type:, severity:, template_pool:)
    content = template_pool.sample
    return nil if content.blank?

    CoachingMessage.create!(
      driver:        @driver,
      trip:          trip,
      trigger_event: trigger_event,
      message_type:  message_type,
      severity:      severity,
      content:       content
    )
  rescue ActiveRecord::RecordInvalid => e
    Rails.logger.warn "[DriverCoachingService] 메시지 생성 실패: #{e.message}"
    nil
  end

  # 같은 날 중복 수상 방지
  def award_badge(badge_type, level, criteria = {})
    existing = DriverBadge.find_by(driver: @driver, badge_type: badge_type, earned_on: Date.today)
    return if existing.present?

    DriverBadge.create!(
      driver:             @driver,
      badge_type:         badge_type,
      level:              level,
      earned_on:          Date.today,
      criteria_snapshot:  criteria.to_json
    )
  rescue ActiveRecord::RecordInvalid
    nil
  end

  def send_coaching_fcm
    FcmToken.where(user: @driver).each do |fcm|
      FcmNotificationService.send_to_token(
        token: fcm.token,
        title: '🚗 운전 코칭 알림',
        body:  '새로운 운전 개선 피드백이 도착했습니다.',
        data:  { type: 'coaching_alert' }
      )
    end
  end
end
