##
# FCM 푸시 알림 서비스 — Epic 14 + Guardian 알림 설정 개인화
#
# Firebase Admin SDK 대신 HTTP v1 API를 직접 호출합니다.
# 환경변수:
#   FCM_PROJECT_ID    — Firebase 프로젝트 ID
#   FCM_SERVICE_ACCOUNT_JSON — 서비스 계정 키 JSON 문자열 (또는 파일 경로)
#
# 개발/테스트 환경에서는 FCM 전송을 시뮬레이션하고 로그만 기록합니다.
##
class FcmNotificationService
  FCM_API_URL = 'https://fcm.googleapis.com/v1/projects/%<project_id>s/messages:send'

  # ─── 이벤트별 헬퍼 ──────────────────────────────────────────────

  # 운행 시작 → 기관의 모든 보호자에게 개별 설정에 따라 알림
  def self.notify_trip_started(trip)
    institution = trip.institution

    passengers_with_guardians = trip.check_ins
                                    .includes(passenger: :guardians)
                                    .map(&:passenger)
                                    .compact
                                    .uniq

    passengers_with_guardians.each do |passenger|
      passenger.guardians.each do |guardian|
        setting = find_setting(guardian, 'trip_started')
        next unless setting.enabled

        body = NotificationTemplateService.render(
          setting.effective_template,
          institution_name: institution.name,
          passenger_name: passenger.name
        )

        tokens = FcmToken.where(user_id: guardian.user_id).pluck(:token)
        next if tokens.empty?

        send_multicast(
          tokens: tokens,
          title: '송영 운행 시작',
          body: body,
          data: { type: 'trip_started', trip_id: trip.id.to_s },
          notification_type: 'trip_started',
          institution: institution
        )
      end
    end
  end

  # 탑승 완료 → 해당 승객의 보호자에게 개별 설정에 따라 알림
  def self.notify_boarded(check_in)
    passenger   = check_in.passenger
    institution = check_in.trip.institution

    passenger.guardians.each do |guardian|
      setting = find_setting(guardian, 'boarded')
      next unless setting.enabled

      body = NotificationTemplateService.render(
        setting.effective_template,
        passenger_name: passenger.name,
        institution_name: institution.name
      )

      tokens = FcmToken.where(user_id: guardian.user_id).pluck(:token)
      next if tokens.empty?

      send_multicast(
        tokens: tokens,
        title: '탑승 완료',
        body: body,
        data: { type: 'boarded', passenger_id: passenger.id.to_s,
                trip_id: check_in.trip_id.to_s },
        notification_type: 'boarded',
        institution: institution
      )
    end
  end

  # 하차 완료 → 해당 승객의 보호자에게 개별 설정에 따라 알림
  def self.notify_alighted(check_in)
    passenger   = check_in.passenger
    institution = check_in.trip.institution

    passenger.guardians.each do |guardian|
      setting = find_setting(guardian, 'alighted')
      next unless setting.enabled

      body = NotificationTemplateService.render(
        setting.effective_template,
        passenger_name: passenger.name,
        institution_name: institution.name
      )

      tokens = FcmToken.where(user_id: guardian.user_id).pluck(:token)
      next if tokens.empty?

      send_multicast(
        tokens: tokens,
        title: '하차 완료',
        body: body,
        data: { type: 'alighted', passenger_id: passenger.id.to_s,
                trip_id: check_in.trip_id.to_s },
        notification_type: 'alighted',
        institution: institution
      )
    end
  end

  # ETA 5분 이내 알림
  # context_type: :before_boarding (탑승 전) | :before_alighting (하차 전)
  def self.notify_eta_approaching(trip, passenger, eta_minutes, context_type: :before_boarding)
    institution = trip.institution
    notif_type  = context_type == :before_alighting ? 'eta_before_alighting' : 'eta_before_boarding'
    title       = context_type == :before_alighting ? '하차 예정 알림' : '탑승 예정 알림'

    passenger.guardians.each do |guardian|
      setting = find_setting(guardian, notif_type)
      next unless setting.enabled

      body = NotificationTemplateService.render(
        setting.effective_template,
        eta_minutes: eta_minutes.to_s,
        passenger_name: passenger.name,
        institution_name: institution.name
      )

      tokens = FcmToken.where(user_id: guardian.user_id).pluck(:token)
      next if tokens.empty?

      send_multicast(
        tokens: tokens,
        title: title,
        body: body,
        data: { type: notif_type, passenger_id: passenger.id.to_s,
                trip_id: trip.id.to_s, eta_minutes: eta_minutes.to_s },
        notification_type: notif_type,
        institution: institution
      )
    end
  end

  # DTC 경고 → 기관 관리자에게 알림 (설정과 무관하게 항상 발송)
  def self.notify_dtc_alert(dtc_report)
    institution = dtc_report.vehicle.institution
    admin_user_ids = institution.users.where(role: 'institution_admin').pluck(:id)
    tokens = FcmToken.where(user_id: admin_user_ids).pluck(:token)
    return if tokens.empty?

    send_multicast(
      tokens: tokens,
      title: '차량 이상 감지',
      body:  "#{dtc_report.vehicle.plate_number} 차량에서 오류 코드 #{dtc_report.code}가 감지되었습니다.",
      data:  { type: 'dtc_alert', dtc_report_id: dtc_report.id.to_s },
      notification_type: 'dtc_alert',
      institution: institution
    )
  end

  # ─── 발송 ───────────────────────────────────────────────────────

  def self.send_multicast(tokens:, title:, body:, data: {}, notification_type:, institution: nil)
    return simulate(tokens, title, body, notification_type, institution) unless fcm_configured?

    tokens.each_slice(500) do |batch|
      batch.each do |token|
        send_to_token(token: token, title: title, body: body, data: data,
                      notification_type: notification_type, institution: institution)
      end
    end
  end

  # ─── 내부 ───────────────────────────────────────────────────────

  # guardian의 notif_type 설정 조회 (없으면 기본값으로 생성된 인스턴스 반환)
  private_class_method def self.find_setting(guardian, notif_type)
    guardian.notification_settings.find_by(notif_type: notif_type) ||
      GuardianNotificationSetting.new(
        guardian: guardian,
        notif_type: notif_type,
        enabled: true,
        template: nil
      )
  end

  private_class_method def self.send_to_token(token:, title:, body:, data:, notification_type:, institution:)
    access_token = fetch_access_token
    url = format(FCM_API_URL, project_id: ENV['FCM_PROJECT_ID'])

    payload = {
      message: {
        token: token,
        notification: { title: title, body: body },
        data: data.transform_values(&:to_s),
        android: { priority: 'high' },
        apns:    { headers: { 'apns-priority' => '10' } }
      }
    }.to_json

    response = Net::HTTP.post(
      URI(url),
      payload,
      'Authorization' => "Bearer #{access_token}",
      'Content-Type'  => 'application/json'
    )

    success = response.code.to_i == 200
    msg_id  = success ? JSON.parse(response.body)['name'] : nil

    NotificationLog.create!(
      institution:       institution,
      notification_type: notification_type,
      title:             title,
      body:              body,
      data:              data.to_json,
      status:            success ? 'sent' : 'failed',
      fcm_message_id:    msg_id
    )
  rescue => e
    Rails.logger.error "[FCM] send_to_token error: #{e.message}"
  end

  private_class_method def self.fetch_access_token
    require 'googleauth'
    credentials = Google::Auth::ServiceAccountCredentials.make_creds(
      json_key_io: StringIO.new(ENV.fetch('FCM_SERVICE_ACCOUNT_JSON')),
      scope:       'https://www.googleapis.com/auth/firebase.messaging'
    )
    credentials.fetch_access_token!['access_token']
  end

  private_class_method def self.fcm_configured?
    ENV['FCM_PROJECT_ID'].present? && ENV['FCM_SERVICE_ACCOUNT_JSON'].present?
  end

  # FCM 미설정 시 개발 환경 시뮬레이션
  private_class_method def self.simulate(tokens, title, body, notification_type, institution)
    Rails.logger.info "[FCM SIMULATE] #{notification_type} → #{tokens.size} tokens | #{title}: #{body}"
    tokens.each do |token|
      NotificationLog.create!(
        institution:       institution,
        notification_type: notification_type,
        title:             title,
        body:              body,
        data:              '{}',
        status:            'sent',
        fcm_message_id:    "simulated-#{SecureRandom.hex(8)}"
      )
    end
  end
end
