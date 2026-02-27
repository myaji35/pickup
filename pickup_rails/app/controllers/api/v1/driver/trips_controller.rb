module Api
  module V1
    module Driver
      class TripsController < ApplicationController
        before_action :require_driver!
        before_action :set_trip, only: [:show, :start, :end, :update_location]

        # GET /api/v1/driver/trips
        def index
          date = params[:date] ? Date.parse(params[:date]) : Date.today
          trips = current_user.trips
                              .includes(:roster, :vehicle, check_ins: :passenger)
                              .where(trip_date: date)
                              .order(:shuttle_type)
          render_success(trips.map { |t| trip_json(t) })
        end

        # GET /api/v1/driver/trips/:id
        def show
          render_success(trip_detail_json(@trip))
        end

        # POST /api/v1/driver/trips/:id/start
        def start
          if @trip.scheduled?
            @trip.start!
            render_success(trip_json(@trip))
          else
            render_error("운행을 시작할 수 없는 상태입니다")
          end
        end

        # POST /api/v1/driver/trips/:id/end
        def end
          if @trip.in_progress?
            @trip.end!
            render_success(trip_json(@trip))
          else
            render_error("운행을 종료할 수 없는 상태입니다")
          end
        end

        # POST /api/v1/driver/trips/:id/update_location
        # Body: { lat: 37.123, lng: 127.456, heading: 90.0, speed: 40.5 }
        def update_location
          unless @trip.in_progress?
            return render_error("운행 중인 상태에서만 위치를 업데이트할 수 있습니다", status: :unprocessable_entity)
          end

          payload = LocationUpdateService.new(
            @trip,
            lat:     params.require(:lat),
            lng:     params.require(:lng),
            heading: params[:heading],
            speed:   params[:speed]
          ).call

          render_success(payload)
        rescue ActionController::ParameterMissing => e
          render_error("위치 정보 누락: #{e.param}", status: :bad_request)
        end

        private

        def set_trip
          @trip = current_user.trips.includes(:vehicle, roster: :institution).find(params[:id])
        rescue ActiveRecord::RecordNotFound
          render_error("운행을 찾을 수 없습니다", status: :not_found)
        end

        def trip_json(trip)
          {
            id:               trip.id,
            trip_date:        trip.trip_date,
            shuttle_type:     trip.shuttle_type,
            status:           trip.status,
            started_at:       trip.started_at,
            ended_at:         trip.ended_at,
            current_lat:      trip.current_lat,
            current_lng:      trip.current_lng,
            location_updated_at: trip.location_updated_at,
            passengers_count: trip.check_ins.size
          }
        end

        def trip_detail_json(trip)
          trip_json(trip).merge(
            vehicle: {
              id:        trip.vehicle.id,
              plate_number: trip.vehicle.plate_number,
              plate_last4: trip.vehicle.plate_last4,
              current_lat: trip.vehicle.current_lat,
              current_lng: trip.vehicle.current_lng,
              heading:     trip.vehicle.heading,
              speed:       trip.vehicle.speed
            },
            passengers: trip.check_ins.includes(:passenger).map do |ci|
              {
                check_in_id:     ci.id,
                passenger_id:    ci.passenger_id,
                name:            ci.passenger.name,
                phone:           ci.passenger.phone,
                pickup_address:  ci.passenger.pickup_address,
                pickup_lat:      ci.passenger.pickup_lat,
                pickup_lng:      ci.passenger.pickup_lng,
                status:          ci.status,
                boarded_at:      ci.boarded_at,
                alighted_at:     ci.alighted_at
              }
            end
          )
        end
      end
    end
  end
end
