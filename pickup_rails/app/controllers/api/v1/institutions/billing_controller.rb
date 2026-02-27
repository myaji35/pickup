##
# BillingController — 기관 결제 및 구독 관리 API
#
# 엔드포인트:
#   GET    /api/v1/institutions/billing/status        — 현재 구독 + 결제 상태
#   POST   /api/v1/institutions/billing/register_card — 카드 등록 (빌링키 발급)
#   GET    /api/v1/institutions/billing/history       — 결제 이력
#   GET    /api/v1/institutions/billing/invoices      — 인보이스 목록
#   POST   /api/v1/institutions/billing/change_plan   — 플랜 변경 요청 (어드민 승인 대기)
#
# 인증: JWT Bearer (기관 관리자 or 슈퍼어드민)
##
module Api
  module V1
    module Institutions
      class BillingController < ApplicationController
        before_action :authenticate_user!
        before_action :set_institution
        before_action :authorize_billing_access!

        # GET /api/v1/institutions/billing/status
        def status
          subscription = current_subscription

          if subscription.nil?
            return render_success({
              subscription: nil,
              plan:         nil,
              has_billing:  false,
              message:      "구독 정보가 없습니다.",
            })
          end

          render_success({
            subscription: subscription_json(subscription),
            plan:         plan_json(subscription.plan),
            has_billing:  subscription.toss_billing_key.present?,
            last_payment: last_payment_json(subscription),
          })
        end

        # POST /api/v1/institutions/billing/register_card
        # body: { auth_key: "..." }  — 토스페이먼츠 클라이언트에서 발급된 authKey
        def register_card
          auth_key = params[:auth_key]
          return render_error("auth_key가 필요합니다.", :bad_request) if auth_key.blank?

          subscription = current_or_trial_subscription
          return render_error("구독 정보가 없습니다.", :not_found) if subscription.nil?

          svc = SubscriptionBillingService.new(subscription)
          billing_key = svc.save_billing_key!(auth_key: auth_key)

          render_success({
            message:         "카드가 성공적으로 등록되었습니다.",
            subscription:    subscription_json(subscription.reload),
            billing_enabled: true,
          })
        rescue TossPaymentsService::TossPaymentsError => e
          render_error("카드 등록 실패: #{e.message}", :unprocessable_entity)
        rescue => e
          Rails.logger.error "[BillingController#register_card] #{e.message}"
          render_error("카드 등록 중 오류가 발생했습니다.", :internal_server_error)
        end

        # GET /api/v1/institutions/billing/history
        def history
          records = PaymentRecord
            .where(institution: @institution)
            .includes(:invoice)
            .recent
            .limit(50)

          render_success(records.map { |r| payment_record_json(r) })
        end

        # GET /api/v1/institutions/billing/invoices
        def invoices
          invoices = Invoice
            .where(institution: @institution)
            .includes(:payment_record)
            .recent
            .limit(50)

          render_success(invoices.map { |inv| invoice_json(inv) })
        end

        # POST /api/v1/institutions/billing/change_plan
        # body: { plan_code: "pro" }
        def change_plan
          plan_code = params[:plan_code]
          new_plan  = Plan.active.find_by(code: plan_code)
          return render_error("유효하지 않은 플랜 코드입니다.", :bad_request) if new_plan.nil?

          subscription = current_or_trial_subscription
          return render_error("구독 정보가 없습니다.", :not_found) if subscription.nil?

          old_plan = subscription.plan

          # 다운그레이드: 다음 갱신일부터 / 업그레이드: 즉시 적용
          if new_plan.monthly_price >= old_plan.monthly_price
            subscription.update!(plan: new_plan, notes: "플랜 업그레이드: #{old_plan.code} → #{new_plan.code}")
            render_success({
              message: "#{new_plan.name} 플랜으로 즉시 업그레이드되었습니다.",
              subscription: subscription_json(subscription.reload),
            })
          else
            subscription.update!(notes: "플랜 다운그레이드 예정 (다음 갱신일): #{old_plan.code} → #{new_plan.code}")
            render_success({
              message: "#{new_plan.name} 플랜으로 변경이 예약되었습니다. 다음 갱신일부터 적용됩니다.",
              subscription: subscription_json(subscription),
            })
          end
        end

        private

        def set_institution
          @institution = if current_user.super_admin?
            Institution.find(params[:institution_id])
          else
            current_user.institution
          end
        rescue ActiveRecord::RecordNotFound
          render_error("기관을 찾을 수 없습니다.", :not_found)
        end

        def authorize_billing_access!
          return if current_user.super_admin?
          return if current_user.institution_id == @institution.id

          render_error("접근 권한이 없습니다.", :forbidden)
        end

        def current_subscription
          @institution.subscriptions
            .where(status: [:trial, :active, :suspended])
            .order(created_at: :desc)
            .first
        end

        def current_or_trial_subscription
          @institution.subscriptions
            .where(status: [:trial, :active, :suspended, :expired])
            .order(created_at: :desc)
            .first
        end

        def last_payment_json(subscription)
          last = subscription.payment_records.recent.first
          return nil if last.nil?

          {
            status:    last.status,
            amount:    last.amount_krw,
            paid_at:   last.paid_at,
            card:      last.card_company,
          }
        end

        def subscription_json(sub)
          {
            id:                    sub.id,
            status:                sub.status,
            plan_code:             sub.plan.code,
            plan_name:             sub.plan.name,
            start_date:            sub.start_date,
            end_date:              sub.end_date,
            trial_ends_at:         sub.trial_ends_at,
            next_billing_date:     sub.next_billing_date,
            failed_payment_count:  sub.failed_payment_count,
            has_billing_key:       sub.toss_billing_key.present?,
            in_trial:              sub.in_trial?,
            days_until_billing:    sub.days_until_next_billing,
          }
        end

        def plan_json(plan)
          {
            id:            plan.id,
            code:          plan.code,
            name:          plan.name,
            monthly_price: plan.monthly_price,
            features:      plan.features_hash,
          }
        end

        def payment_record_json(record)
          {
            id:               record.id,
            order_id:         record.toss_order_id,
            amount:           record.amount_krw,
            status:           record.status,
            card_company:     record.card_company,
            card_number:      record.card_number_masked,
            paid_at:          record.paid_at,
            failure_reason:   record.failure_reason,
            invoice_number:   record.invoice&.invoice_number,
            created_at:       record.created_at,
          }
        end

        def invoice_json(inv)
          {
            id:             inv.id,
            invoice_number: inv.invoice_number,
            amount:         inv.amount_krw,
            tax_amount:     inv.tax_amount_krw,
            total:          inv.total_with_tax,
            issue_date:     inv.issue_date,
            due_date:       inv.due_date,
            status:         inv.status,
            pdf_url:        inv.pdf_url,
          }
        end
      end
    end
  end
end
