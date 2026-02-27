##
# Admin::SubscriptionsController — 슈퍼어드민 구독 관리 API
#
# 엔드포인트:
#   GET    /api/v1/admin/subscriptions              — 전체 구독 목록
#   GET    /api/v1/admin/subscriptions/:id          — 구독 상세
#   PATCH  /api/v1/admin/subscriptions/:id/plan     — 플랜 강제 변경
#   POST   /api/v1/admin/subscriptions/:id/activate — 구독 활성화 (체험 → 활성)
#   POST   /api/v1/admin/subscriptions/:id/suspend  — 구독 정지
#   POST   /api/v1/admin/subscriptions/:id/cancel   — 구독 해지
#   POST   /api/v1/admin/subscriptions/:id/charge   — 수동 결제 실행
##
module Api
  module V1
    module Admin
      class SubscriptionsController < ApplicationController
        before_action :authenticate_user!
        before_action :require_super_admin!
        before_action :set_subscription, only: %i[show change_plan activate suspend cancel charge]

        # GET /api/v1/admin/subscriptions
        def index
          subscriptions = Subscription.includes(:institution, :plan)
                            .order(created_at: :desc)
                            .limit(100)

          # 필터
          subscriptions = subscriptions.where(status: params[:status]) if params[:status].present?

          render_success(subscriptions.map { |s| subscription_detail_json(s) })
        end

        # GET /api/v1/admin/subscriptions/:id
        def show
          render_success(subscription_detail_json(@subscription))
        end

        # PATCH /api/v1/admin/subscriptions/:id/plan
        def change_plan
          plan = Plan.find_by(code: params[:plan_code])
          return render_error("유효하지 않은 플랜 코드입니다.", :bad_request) if plan.nil?

          @subscription.update!(plan: plan, notes: "슈퍼어드민 플랜 변경: #{plan.code}")
          render_success(subscription_detail_json(@subscription.reload))
        end

        # POST /api/v1/admin/subscriptions/:id/activate
        def activate
          @subscription.update!(status: :active, failed_payment_count: 0)
          render_success({ message: "구독이 활성화되었습니다.", subscription: subscription_detail_json(@subscription) })
        end

        # POST /api/v1/admin/subscriptions/:id/suspend
        def suspend
          @subscription.update!(status: :suspended, notes: params[:reason])
          render_success({ message: "구독이 정지되었습니다.", subscription: subscription_detail_json(@subscription) })
        end

        # POST /api/v1/admin/subscriptions/:id/cancel
        def cancel
          @subscription.update!(status: :cancelled, notes: params[:reason])
          render_success({ message: "구독이 해지되었습니다.", subscription: subscription_detail_json(@subscription) })
        end

        # POST /api/v1/admin/subscriptions/:id/charge
        def charge
          return render_error("빌링키가 없습니다. 카드를 먼저 등록해야 합니다.", :bad_request) if @subscription.toss_billing_key.blank?

          svc = SubscriptionBillingService.new(@subscription)
          record = svc.charge!

          render_success({
            message:        "결제가 완료되었습니다.",
            payment_record: {
              id:       record.id,
              amount:   record.amount_krw,
              status:   record.status,
              paid_at:  record.paid_at,
            },
          })
        rescue TossPaymentsService::TossPaymentsError => e
          render_error("결제 실패: #{e.message}", :unprocessable_entity)
        end

        private

        def set_subscription
          @subscription = Subscription.includes(:institution, :plan).find(params[:id])
        rescue ActiveRecord::RecordNotFound
          render_error("구독을 찾을 수 없습니다.", :not_found)
        end

        def require_super_admin!
          render_error("슈퍼어드민 권한이 필요합니다.", :forbidden) unless current_user.super_admin?
        end

        def subscription_detail_json(sub)
          {
            id:                    sub.id,
            institution_id:        sub.institution_id,
            institution_name:      sub.institution.name,
            plan_code:             sub.plan.code,
            plan_name:             sub.plan.name,
            monthly_price:         sub.plan.monthly_price,
            status:                sub.status,
            start_date:            sub.start_date,
            end_date:              sub.end_date,
            trial_ends_at:         sub.trial_ends_at,
            next_billing_date:     sub.next_billing_date,
            failed_payment_count:  sub.failed_payment_count,
            has_billing_key:       sub.toss_billing_key.present?,
            notes:                 sub.notes,
            created_at:            sub.created_at,
          }
        end
      end
    end
  end
end
