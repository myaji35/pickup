module Api
  module V1
    module Institutions
      # 기관 관리자용 실시간 차량 위치 조회
      class VehicleLocationsController < ApplicationController
        before_action :require_institution_admin!

        # GET /api/v1/institutions/vehicle_locations
        # 현재 운행 중인 차량 위치 목록 (폴링 fallback 용)
        def index
          today = Date.today
          active_trips = current_institution.rosters
                                            .joins(:trips)
                                            .where(trips: { trip_date: today, status: :in_progress })
                                            .includes(trips: [:vehicle, :driver, check_ins: :passenger])
                                            .flat_map(&:trips)
                                            .select(&:in_progress?)

          render_success(active_trips.map { |t| trip_location_json(t) })
        end

        # GET /api/v1/institutions/vehicle_locations/:trip_id
        # 단일 운행 상세 위치 + 탑승자 현황
        def show
          trip = current_institution.rosters
                                    .joins(:trips)
                                    .where(trips: { id: params[:trip_id] })
                                    .includes(trips: [:vehicle, :driver, check_ins: :passenger])
                                    .flat_map(&:trips)
                                    .first

          return render_error("운행을 찾을 수 없습니다", status: :not_found) unless trip

          render_success(trip_location_detail_json(trip))
        end

        private

        def current_institution
          current_user.institution
        end

        def trip_location_json(trip)
          {
            trip_id:         trip.id,
            shuttle_type:    trip.shuttle_type,
            status:          trip.status,
            started_at:      trip.started_at,
            vehicle: {
              id:            trip.vehicle.id,
              plate_number:  trip.vehicle.plate_number,
              plate_last4:   trip.vehicle.plate_last4,
              capacity:      trip.vehicle.capacity
            },
            driver: {
              id:   trip.driver.id,
              name: trip.driver.name,
              phone: trip.driver.phone
            },
            location: {
              lat:        trip.current_lat,
              lng:        trip.current_lng,
              heading:    trip.vehicle.heading,
              speed:      trip.vehicle.speed,
              updated_at: trip.location_updated_at&.iso8601
            },
            passengers_total:   trip.check_ins.size,
            passengers_boarded: trip.check_ins.count(&:boarded?)
          }
        end

        def trip_location_detail_json(trip)
          trip_location_json(trip).merge(
            passengers: trip.check_ins.includes(:passenger).map do |ci|
              {
                check_in_id:    ci.id,
                name:           ci.passenger.name,
                phone:          ci.passenger.phone,
                pickup_address: ci.passenger.pickup_address,
                pickup_lat:     ci.passenger.pickup_lat,
                pickup_lng:     ci.passenger.pickup_lng,
                status:         ci.status,
                boarded_at:     ci.boarded_at,
                alighted_at:    ci.alighted_at
              }
            end
          )
        end
      end
    end
  end
end
