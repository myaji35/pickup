module Api
  module V1
    module Institutions
      # RiskReportsController — 기관 어드민용 보험 리스크 리포트 API
      class RiskReportsController < ApplicationController
        # GET /api/v1/institutions/risk_reports/current
        # 현재 달 리스크 지수 즉시 산출
        def current
          data = RiskIndexCalculatorService.new(
            current_institution,
            Date.today.beginning_of_month,
            Date.today
          ).calculate

          render json: {
            institution_id: current_institution.id,
            period:         Date.today.strftime('%Y-%m'),
            as_of:          Date.today.to_s,
            **data
          }
        end

        # GET /api/v1/institutions/risk_reports/monthly?month=2026-01
        # 특정 월 전체 리포트 (InsuranceSafetyReportService)
        def monthly
          month = parse_month(params[:month])
          return render json: { error: 'month 파라미터 필요 (YYYY-MM)' }, status: :bad_request if month.nil?

          report = InsuranceSafetyReportService.new(current_institution, month).generate
          render json: report
        end

        # GET /api/v1/institutions/risk_reports/trend?months=6
        # 최근 N개월 리스크 지수 추이
        def trend
          n = (params[:months] || 6).to_i.clamp(1, 12)
          trend_data = n.times.map do |i|
            month = (Date.today - i.months).beginning_of_month
            risk  = RiskIndexCalculatorService.new(current_institution, month, month.end_of_month).calculate
            {
              period:            month.strftime('%Y-%m'),
              risk_index:        risk[:risk_index],
              risk_level:        risk[:risk_level],
              discount_rate_pct: risk[:discount_rate_pct]
            }
          end.reverse

          render json: { institution_id: current_institution.id, trend: trend_data }
        end

        private

        def parse_month(str)
          return nil if str.blank?
          Date.strptime(str, '%Y-%m').beginning_of_month
        rescue Date::Error, ArgumentError
          nil
        end
      end
    end
  end
end
