module Api
  module V1
    module Guardian
      # 보호자 운행 조회 API
      class TripsController < ApplicationController
        before_action :authenticate!
        before_action :require_guardian!

        # GET /api/v1/guardian/trips
        # 내 승객의 이번 주 + 다음 주 운행 목록
        def index
          since = Date.current.beginning_of_week
          until_date = since + 14.days

          trips = Trip
            .joins(roster: :roster_passengers)
            .where(roster_passengers: { passenger_id: my_passenger_ids })
            .where(trip_date: since..until_date)
            .includes(:vehicle, :driver, roster: :roster_passengers)
            .order(:trip_date, :shuttle_type)

          render_success(trips.map { |t| trip_json(t) })
        end

        # GET /api/v1/guardian/trips/active
        # 현재 운행 중인 trip (실시간 추적용)
        def active
          trip = Trip
            .joins(roster: :roster_passengers)
            .where(roster_passengers: { passenger_id: my_passenger_ids })
            .where(status: :in_progress)
            .includes(:vehicle, :driver)
            .order(started_at: :desc)
            .first

          return render_success(nil) unless trip

          render_success(active_trip_json(trip))
        end

        # POST /api/v1/guardian/trips/:trip_id/cancel
        # 당일 탑승 취소 { reason }
        def cancel
          trip = Trip
            .joins(roster: :roster_passengers)
            .where(roster_passengers: { passenger_id: my_passenger_ids })
            .find(params[:trip_id])

          return render_error("예정된 운행만 취소할 수 있습니다", status: :unprocessable_entity) unless trip.scheduled?

          # roster_passenger 찾기
          rp = RosterPassenger
            .joins(:roster)
            .where(rosters: { id: trip.roster_id }, passenger_id: my_passenger_ids)
            .first

          TripCancellation.create!(
            roster_passenger: rp,
            requested_by:     current_user,
            reason:           params[:reason],
            cancel_date:      trip.trip_date
          )

          render_success({ message: "취소 요청이 완료되었습니다" })
        rescue ActiveRecord::RecordNotFound
          render_error("운행을 찾을 수 없습니다", status: :not_found)
        rescue ActiveRecord::RecordInvalid => e
          render_error(e.message, status: :unprocessable_entity)
        end

        private

        def require_guardian!
          render_error("보호자 계정이 필요합니다", status: :forbidden) unless current_user.passenger?
        end

        def my_passenger_ids
          @my_passenger_ids ||= current_user.watched_passengers.pluck(:id)
        end

        def trip_json(trip)
          rp = trip.roster.roster_passengers.find { |r| my_passenger_ids.include?(r.passenger_id) }
          cancelled = rp ? TripCancellation.exists?(roster_passenger_id: rp.id, cancel_date: trip.trip_date) : false

          {
            id:           trip.id,
            trip_date:    trip.trip_date,
            shuttle_type: trip.shuttle_type,
            status:       trip.status,
            vehicle: {
              id:           trip.vehicle_id,
              plate_number: trip.vehicle&.plate_number
            },
            driver: {
              id:   trip.driver_id,
              name: trip.driver&.name
            },
            started_at:  trip.started_at&.iso8601,
            ended_at:    trip.ended_at&.iso8601,
            cancelled:   cancelled
          }
        end

        def active_trip_json(trip)
          {
            id:          trip.id,
            trip_date:   trip.trip_date,
            shuttle_type: trip.shuttle_type,
            status:      trip.status,
            vehicle: {
              id:           trip.vehicle_id,
              plate_number: trip.vehicle&.plate_number
            },
            driver: {
              id:   trip.driver_id,
              name: trip.driver&.name
            },
            current_lat:   trip.current_lat,
            current_lng:   trip.current_lng,
            current_speed: trip.current_speed,
            gps_updated_at: trip.gps_updated_at&.iso8601,
            started_at:    trip.started_at&.iso8601,
            # 직선거리 ETA (분) - 현재 위치 ~ 픽업 지점 미구현 시 nil
            eta_minutes:   nil
          }
        end
      end
    end
  end
end
