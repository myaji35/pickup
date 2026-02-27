# MaintenancePredictionJob
# 매일 03:00 전체 활성 차량의 예측 정비 갱신 + D-30/D-7 FCM 알림 발송
class MaintenancePredictionJob < ApplicationJob
  queue_as :default

  COMPONENT_LABELS = {
    'brake_pads' => '브레이크 패드',
    'engine_oil' => '엔진 오일',
    'tires'      => '타이어',
    'air_filter' => '에어 필터',
    'battery'    => '배터리'
  }.freeze

  def perform
    vehicles = Vehicle.where(status: :available)
                      .includes(:institution, maintenance_predictions: [])
    updated  = 0
    notified = 0

    vehicles.each do |vehicle|
      service = MaintenancePredictionService.new(vehicle)
      service.predict_all!
      updated += 1

      notified += send_due_notifications(vehicle)
    end

    Rails.logger.info "[MaintenancePredictionJob] #{updated}대 예측 갱신, #{notified}건 알림 발송"
  end

  private

  def send_due_notifications(vehicle)
    count = 0
    vehicle.reload.maintenance_predictions.each do |pred|
      next unless pred.predicted_due_date.present?

      if pred.needs_d30_notification?
        send_fcm_to_institution(vehicle, pred, 30)
        pred.update_column(:d30_notified_at, Time.current)
        count += 1
      end

      if pred.needs_d7_notification?
        send_fcm_to_institution(vehicle, pred, 7)
        pred.update_column(:d7_notified_at, Time.current)
        count += 1
      end
    end
    count
  end

  def send_fcm_to_institution(vehicle, pred, days_remaining)
    label   = COMPONENT_LABELS[pred.component] || pred.component
    title   = "🔧 정비 예정 알림 — #{vehicle.plate_number}"
    body    = "#{label} 교체 시기가 #{days_remaining}일 후입니다. 미리 예약하세요."

    # 기관 관리자 중 FCM 토큰 보유 유저에게 발송
    admin_users = vehicle.institution.users.where(role: :institution_admin)
    admin_users.each do |admin|
      FcmToken.where(user: admin).each do |fcm|
        FcmNotificationService.send_to_token(
          token: fcm.token,
          title: title,
          body:  body,
          data:  {
            type:            'maintenance_due',
            vehicle_id:      vehicle.id.to_s,
            component:       pred.component,
            days_remaining:  days_remaining.to_s,
            predicted_date:  pred.predicted_due_date.to_s
          }
        )
      end
    end
  end
end
