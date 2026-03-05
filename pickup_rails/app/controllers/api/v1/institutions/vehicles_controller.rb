module Api
  module V1
    module Institutions
      class VehiclesController < ApplicationController
        before_action :require_institution_admin!
        before_action :set_vehicle, only: [:show, :update, :destroy]

        # GET /api/v1/institutions/vehicles
        def index
          vehicles = current_institution.vehicles
                                        .order(created_at: :desc)
                                        .page(params[:page]).per(20)
          render_success(vehicles.map { |v| vehicle_json(v) }, meta: pagination_meta(vehicles))
        end

        # GET /api/v1/institutions/vehicles/:id
        def show
          render_success(vehicle_json(@vehicle))
        end

        # POST /api/v1/institutions/vehicles
        def create
          vehicle = current_institution.vehicles.build(vehicle_params)
          if vehicle.save
            render_success(vehicle_json(vehicle), status: :created)
          else
            render_error("차량 등록 실패", errors: vehicle.errors.full_messages)
          end
        end

        # PATCH /api/v1/institutions/vehicles/:id
        def update
          if @vehicle.update(vehicle_params)
            render_success(vehicle_json(@vehicle))
          else
            render_error("차량 수정 실패", errors: @vehicle.errors.full_messages)
          end
        end

        # DELETE /api/v1/institutions/vehicles/:id
        def destroy
          @vehicle.destroy
          render_success({ message: "차량이 삭제되었습니다" })
        end

        private

        def current_institution
          current_user.institution
        end

        def set_vehicle
          @vehicle = current_institution.vehicles.find(params[:id])
        rescue ActiveRecord::RecordNotFound
          render_error("차량을 찾을 수 없습니다", status: :not_found)
        end

        def vehicle_params
          params.require(:vehicle).permit(:plate_number, :vehicle_type, :capacity, :status)
        end

        def vehicle_json(vehicle)
          {
            id: vehicle.id,
            plate_number: vehicle.plate_number,
            plate_last4: vehicle.plate_last4,
            vehicle_type: vehicle.vehicle_type,
            capacity: vehicle.capacity,
            status: vehicle.status
          }
        end
      end
    end
  end
end
