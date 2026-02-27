# MonthlyRiskReportJob
# 매월 1일 00:30에 전체 활성 기관의 보험 리스크 리포트 생성 후
# 기관 관리자에게 FCM 푸시 알림 발송
class MonthlyRiskReportJob < ApplicationJob
  queue_as :default

  def perform(target_month = nil)
    month_start = target_month ? Date.parse(target_month).beginning_of_month
                               : 1.month.ago.beginning_of_month

    institutions = Institution.where(status: :active)
    reported     = 0

    institutions.each do |institution|
      report = InsuranceSafetyReportService.new(institution, month_start).generate
      notify_institution(institution, report)
      reported += 1
    rescue StandardError => e
      Rails.logger.error "[MonthlyRiskReportJob] 기관 #{institution.id} 오류: #{e.message}"
    end

    Rails.logger.info "[MonthlyRiskReportJob] #{reported}개 기관 리포트 발송 완료 (기간: #{month_start.strftime('%Y-%m')})"
  end

  private

  def notify_institution(institution, report)
    level  = report[:risk_level]
    index  = report[:risk_index]
    period = report[:period]
    rate   = report[:insurance_discount_rate]

    title  = "📊 #{period} 보험 리스크 리포트"
    body   = "리스크 지수 #{index}/100 (#{level_label(level)}) · 할인율 #{rate}%"

    admin_users = institution.users.where(role: :institution_admin)
    admin_users.each do |admin|
      FcmToken.where(user: admin).each do |fcm|
        FcmNotificationService.send_to_token(
          token: fcm.token,
          title: title,
          body:  body,
          data:  {
            type:        'monthly_risk_report',
            period:      period,
            risk_index:  index.to_s,
            risk_level:  level,
            discount:    rate.to_s
          }
        )
      end
    end
  end

  def level_label(level)
    { 'LOW' => '양호', 'MEDIUM' => '보통', 'HIGH' => '위험', 'CRITICAL' => '매우 위험' }[level] || level
  end
end
