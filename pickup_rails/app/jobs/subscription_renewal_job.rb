##
# SubscriptionRenewalJob — 구독 자동 갱신 잡
#
# 실행 스케줄: 매월 1일 00:05 (solid_queue recurring job)
#
# config/recurring.yml 예시:
#   subscription_renewal:
#     class: SubscriptionRenewalJob
#     schedule: "5 0 1 * *"
#     queue: default
##
class SubscriptionRenewalJob < ApplicationJob
  queue_as :default

  def perform
    due = Subscription.due_for_renewal
    Rails.logger.info "[SubscriptionRenewalJob] 갱신 대상: #{due.count}건"

    due.each do |subscription|
      charge_subscription(subscription)
    end
  end

  private

  def charge_subscription(subscription)
    svc = SubscriptionBillingService.new(subscription)
    svc.charge!
    Rails.logger.info "[SubscriptionRenewalJob] 결제 성공: subscription##{subscription.id}"
  rescue => e
    Rails.logger.error "[SubscriptionRenewalJob] 결제 실패: subscription##{subscription.id} — #{e.message}"
    # 개별 실패가 전체 잡을 중단시키지 않도록 rescue 처리
  end
end
