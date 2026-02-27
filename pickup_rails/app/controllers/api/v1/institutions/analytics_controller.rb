require "csv"
##
# AnalyticsController — BI 대시보드 집계 API
#
# 엔드포인트:
#   GET /api/v1/institutions/analytics/overview
#     → KPI 카드 (정시 도착률, 평균 운행 시간, 총 거리, 승하차 완료율)
#
#   GET /api/v1/institutions/analytics/trips
#     → 주간 운행 트렌드 (최근 12주, 정시 도착률 추이)
#
#   GET /api/v1/institutions/analytics/safety
#     → 안전 점수 주간 트렌드 + 이벤트 유형별 월간 집계
#
#   GET /api/v1/institutions/analytics/passengers
#     → 취소율 주간 트렌드
#
#   GET /api/v1/institutions/analytics/export
#     → 운행 데이터 CSV 다운로드
##
module Api
  module V1
    module Institutions
      class AnalyticsController < ApplicationController
        before_action :authenticate_user!
        before_action :set_service

        # GET /api/v1/institutions/analytics/overview
        def overview
          render_success(@svc.overview)
        end

        # GET /api/v1/institutions/analytics/trips
        def trips
          weeks = (params[:weeks] || 12).to_i.clamp(4, 52)
          render_success({
            weekly_trends: @svc.weekly_trip_trends(weeks: weeks),
          })
        end

        # GET /api/v1/institutions/analytics/safety
        def safety
          render_success({
            weekly_scores:   @svc.weekly_safety_trends(weeks: 8),
            monthly_events:  @svc.monthly_safety_events(months: 6),
          })
        end

        # GET /api/v1/institutions/analytics/passengers
        def passengers
          render_success({
            weekly_cancellations: @svc.weekly_cancellation_trends(weeks: 8),
          })
        end

        # GET /api/v1/institutions/analytics/export
        def export
          rows = @svc.export_trips_csv

          csv_data = CSV.generate(encoding: "UTF-8") do |csv|
            rows.each { |row| csv << row }
          end

          send_data "\xEF\xBB\xBF#{csv_data}",
                    filename:    "운행내역_#{Date.current.strftime('%Y%m%d')}.csv",
                    type:        "text/csv; charset=utf-8",
                    disposition: "attachment"
        end

        private

        def set_service
          @svc = AnalyticsQueryService.new(current_user.institution)
        rescue => e
          render_error("기관 정보를 불러올 수 없습니다.", :unprocessable_entity)
        end
      end
    end
  end
end
