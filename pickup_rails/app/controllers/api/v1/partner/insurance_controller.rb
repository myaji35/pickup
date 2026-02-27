##
# Partner::InsuranceController — 보험사 파트너 API
#
# 인증: X-Partner-Key 헤더 (SHA256 digest 비교)
# 대상: ENTERPRISE 플랜 기관만 리포트 제공
#
# GET /api/v1/partner/insurance/safety_report
#   Params: institution_id, month (YYYY-MM)
##
module Api
  module V1
    module Partner
      class InsuranceController < ApplicationController
        skip_before_action :authenticate_user!
        before_action :authenticate_partner!
        before_action :ensure_insurance_partner!

        # GET /api/v1/partner/insurance/safety_report
        def safety_report
          institution = Institution.find_by(id: params[:institution_id])
          return render_error("기관을 찾을 수 없습니다.", :not_found) if institution.nil?

          # ENTERPRISE 플랜 확인
          unless enterprise_institution?(institution)
            return render_error("ENTERPRISE 플랜 기관만 보험 연동 리포트를 제공합니다.", :forbidden)
          end

          month = parse_month(params[:month])
          return render_error("month 파라미터가 필요합니다. (형식: YYYY-MM)", :bad_request) if month.nil?

          report = InsuranceSafetyReportService.new(institution, month).generate
          render_success(report)
        rescue => e
          Rails.logger.error "[InsuranceController] #{e.message}"
          render_error("리포트 생성 실패", :internal_server_error)
        end

        private

        def authenticate_partner!
          raw_key = request.headers["X-Partner-Key"]
          @partner_key = PartnerApiKey.authenticate(raw_key)
          return if @partner_key

          render json: { success: false, error: "유효하지 않은 파트너 API 키입니다." }, status: :unauthorized
        end

        def ensure_insurance_partner!
          return if @partner_key.partner_type == "insurance"

          render json: { success: false, error: "보험사 파트너 키가 필요합니다." }, status: :forbidden
        end

        def enterprise_institution?(institution)
          sub = institution.subscriptions
                           .where(status: [:active, :trial])
                           .order(created_at: :desc)
                           .first
          sub&.plan&.code&.downcase == "enterprise"
        end

        def parse_month(str)
          return nil if str.blank?
          Date.strptime(str, "%Y-%m").beginning_of_month
        rescue Date::Error, ArgumentError
          nil
        end
      end
    end
  end
end
