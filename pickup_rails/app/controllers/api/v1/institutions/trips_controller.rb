module Api
  module V1
    module Institutions
      class TripsController < ApplicationController
        before_action :authenticate_request!
        before_action :require_institution_admin!

        # GET /api/v1/institutions/trips
        # params: date (YYYY-MM-DD), month (YYYY-MM), status, vehicle_id, page
        def index
          trips = Trip.joins(roster: :institution)
                      .where(rosters: { institution_id: current_institution.id })
                      .includes(:driver, :vehicle, roster: {})

          trips = trips.where(status: params[:status]) if params[:status].present?
          trips = trips.where(vehicle_id: params[:vehicle_id]) if params[:vehicle_id].present?

          if params[:date].present?
            trips = trips.where(trip_date: Date.parse(params[:date]))
          elsif params[:month].present?
            date  = Date.parse("#{params[:month]}-01")
            trips = trips.where(trip_date: date.beginning_of_month..date.end_of_month)
          else
            trips = trips.where(trip_date: 30.days.ago.to_date..Date.today)
          end

          trips = trips.order(trip_date: :desc, shuttle_type: :asc)
                       .limit(100)

          render json: { success: true, data: trips.map { |t| serialize_trip(t) } }
        end

        # GET /api/v1/institutions/trips/:id
        def show
          trip = find_trip
          render json: { success: true, data: serialize_trip_detail(trip) }
        end

        # GET /api/v1/institutions/trips/:id/check_ins
        def check_ins
          trip = find_trip
          data = trip.check_ins
                     .includes(:passenger)
                     .order(:boarded_at)
                     .map { |ci| serialize_check_in(ci) }
          render json: { success: true, data: data }
        end

        private

        def find_trip
          Trip.joins(roster: :institution)
              .where(rosters: { institution_id: current_institution.id })
              .includes(:driver, :vehicle, :check_ins, roster: {})
              .find(params[:id])
        rescue ActiveRecord::RecordNotFound
          render json: { success: false, error: '운행 정보를 찾을 수 없습니다.' }, status: :not_found
          raise
        end

        def serialize_trip(t)
          {
            id:            t.id,
            trip_date:     t.trip_date,
            shuttle_type:  t.shuttle_type,
            status:        t.status,
            started_at:    t.started_at,
            ended_at:      t.ended_at,
            vehicle: {
              id:           t.vehicle.id,
              plate_last4:  t.vehicle.plate_last4,
              plate_number: t.vehicle.respond_to?(:plate_number) ? t.vehicle.plate_number : nil,
            },
            driver: {
              id:   t.driver.id,
              name: t.driver.name,
            },
            total_passengers: t.check_ins.size,
            boarded_count:    t.check_ins.count { |ci| %w[boarded alighted].include?(ci.status.to_s) },
          }
        end

        def serialize_trip_detail(t)
          serialize_trip(t).merge(
            check_ins: t.check_ins.includes(:passenger).order(:boarded_at).map { |ci| serialize_check_in(ci) },
            last_fuel_level: t.last_fuel_level,
            obd_updated_at:  t.obd_updated_at,
          )
        end

        def serialize_check_in(ci)
          {
            id:            ci.id,
            passenger_id:  ci.passenger_id,
            passenger_name: ci.passenger.name,
            status:        ci.status,
            source:        ci.source,
            boarded_at:    ci.boarded_at,
            alighted_at:   ci.alighted_at,
          }
        end
      end
    end
  end
end
