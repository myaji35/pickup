# WeeklyCoachingJob
# 매주 월요일 07:00에 전 주 드라이버 코칭 요약 생성
class WeeklyCoachingJob < ApplicationJob
  queue_as :default

  def perform(target_week = nil)
    week_start = target_week ? Date.parse(target_week).beginning_of_week
                              : 1.week.ago.beginning_of_week

    drivers = User.where(role: :driver, is_active: true)
    processed = 0

    drivers.each do |driver|
      DriverCoachingService.new(driver).generate_weekly_summary(week_start)
      processed += 1
    rescue StandardError => e
      Rails.logger.error "[WeeklyCoachingJob] 드라이버 #{driver.id} 오류: #{e.message}"
    end

    Rails.logger.info "[WeeklyCoachingJob] #{processed}명 주간 코칭 요약 완료 (기간: #{week_start})"
  end
end
