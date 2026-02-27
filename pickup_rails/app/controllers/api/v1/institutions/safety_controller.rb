module Api
  module V1
    module Institutions
      class SafetyController < ApplicationController
        before_action :require_institution_admin!

        # GET /api/v1/institutions/safety/scores
        # 드라이버별 주간 안전 점수 (현재 주 또는 지정 주차)
        def scores
          year = (params[:year] || Time.current.year).to_i
          week = (params[:week] || Time.current.strftime('%V')).to_i

          scores = DriverSafetyScore
            .for_institution(current_institution.id)
            .where(period_year: year, period_week: week)
            .includes(:driver)
            .order(:rank_in_institution)

          render_success({
            year:    year,
            week:    week,
            drivers: scores.map { |s| score_json(s) }
          })
        end

        # GET /api/v1/institutions/safety/events
        # 기관 내 드라이버 안전 이벤트 목록
        # Query: date_from, date_to, event_type, driver_id, limit (default 50)
        def events
          scope = DrivingEvent
            .joins(trip: { roster: :institution })
            .where(rosters: { institution_id: current_institution.id })
            .includes(:driver, :trip)
            .order(created_at: :desc)

          scope = scope.where(event_type: params[:event_type]) if params[:event_type].present?
          scope = scope.where(driver_id:  params[:driver_id].to_i) if params[:driver_id].present?
          if params[:date_from].present?
            scope = scope.where(created_at: Date.parse(params[:date_from]).beginning_of_day..)
          end
          if params[:date_to].present?
            scope = scope.where(created_at: ..Date.parse(params[:date_to]).end_of_day)
          end

          limit = (params[:limit] || 50).to_i.clamp(1, 200)
          render_success(scope.limit(limit).map { |ev| event_json(ev) })
        end

        # GET /api/v1/institutions/safety/summary
        # 기관 전체 안전 요약 (최근 30일)
        def summary
          institution_id = current_institution.id
          since = 30.days.ago

          event_counts = DrivingEvent
            .joins(trip: { roster: :institution })
            .where(rosters: { institution_id: institution_id })
            .where(created_at: since..)
            .group(:event_type)
            .count

          dtc_count = DtcReport
            .joins(trip: { roster: :institution })
            .where(rosters: { institution_id: institution_id })
            .where(created_at: since..)
            .count

          # 드라이버별 집계
          driver_stats = DrivingEvent
            .joins(trip: { roster: :institution })
            .joins(:driver)
            .where(rosters: { institution_id: institution_id })
            .where(created_at: since..)
            .group("users.id", "users.name")
            .count
            .map { |(id, name), cnt| { driver_id: id, name: name, event_count: cnt } }
            .sort_by { |d| -d[:event_count] }
            .first(10)

          render_success({
            period_days:    30,
            total_events:   event_counts.values.sum,
            by_type:        event_counts,
            dtc_count:      dtc_count,
            top_drivers:    driver_stats,
            generated_at:   Time.current.iso8601
          })
        end

        # GET /api/v1/institutions/safety/dtc_history
        # DTC 이력 조회
        def dtc_history
          scope = DtcReport
            .joins(trip: { roster: :institution })
            .where(rosters: { institution_id: current_institution.id })
            .includes(:vehicle, :trip)
            .order(created_at: :desc)

          scope = scope.where(status: params[:status]) if params[:status].present?
          scope = scope.where(code:   params[:code])   if params[:code].present?

          limit = (params[:limit] || 50).to_i.clamp(1, 200)
          render_success(scope.limit(limit).map { |d| dtc_json(d) })
        end

        # PATCH /api/v1/institutions/safety/dtc_history/:id/acknowledge
        # DTC 확인 처리
        def acknowledge_dtc
          report = DtcReport
            .joins(trip: { roster: :institution })
            .where(rosters: { institution_id: current_institution.id })
            .find(params[:id])

          report.update!(status: 'acknowledged')
          render_success(dtc_json(report))
        rescue ActiveRecord::RecordNotFound
          render_error("DTC 기록을 찾을 수 없습니다", status: :not_found)
        end

        private

        def current_institution
          @current_institution ||= current_user.institution
        end

        def event_json(ev)
          {
            id:         ev.id,
            event_type: ev.event_type,
            speed:      ev.speed,
            rpm:        ev.rpm,
            lat:        ev.lat,
            lng:        ev.lng,
            trip_id:    ev.trip_id,
            driver: {
              id:   ev.driver_id,
              name: ev.driver.name
            },
            occurred_at: ev.created_at.iso8601
          }
        end

        def dtc_json(d)
          {
            id:         d.id,
            code:       d.code,
            status:     d.status,
            trip_id:    d.trip_id,
            vehicle: {
              id:          d.vehicle_id,
              plate_number: d.vehicle.plate_number
            },
            reported_at: d.created_at.iso8601
          }
        end

        def score_json(s)
          {
            driver_id:          s.driver_id,
            driver_name:        s.driver.name,
            total_score:        s.total_score.to_f,
            rank:               s.rank_in_institution,
            harsh_accel_count:  s.harsh_accel_count,
            harsh_brake_count:  s.harsh_brake_count,
            speeding_count:     s.speeding_count,
            idling_count:       s.idling_count,
            total_trips:        s.total_trips,
            period_year:        s.period_year,
            period_week:        s.period_week,
            updated_at:         s.updated_at.iso8601
          }
        end
      end
    end
  end
end
