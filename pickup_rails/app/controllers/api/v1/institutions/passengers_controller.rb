module Api
  module V1
    module Institutions
      class PassengersController < ApplicationController
        before_action :require_institution_admin!
        before_action :set_passenger, only: [:show, :update, :destroy]

        # GET /api/v1/institutions/passengers
        def index
          passengers = current_institution.passengers.active
          passengers = passengers.where("name LIKE ?", "%#{params[:q]}%") if params[:q].present?
          passengers = passengers.order(:name).page(params[:page]).per(params[:per_page] || 30)
          render_success(passengers.map { |p| passenger_json(p) }, meta: pagination_meta(passengers))
        end

        # GET /api/v1/institutions/passengers/:id
        def show
          render_success(passenger_json(@passenger))
        end

        # POST /api/v1/institutions/passengers
        def create
          passenger = current_institution.passengers.build(passenger_params)
          if passenger.save
            render_success(passenger_json(passenger), status: :created)
          else
            render_error("승객 등록 실패", errors: passenger.errors.full_messages)
          end
        end

        # POST /api/v1/institutions/passengers/bulk_import (CSV 업로드)
        def bulk_import
          csv_file = params[:csv_file] || params[:file]
          return render_error("CSV 파일이 없습니다") unless csv_file

          file_io = csv_file.respond_to?(:tempfile) ? csv_file.tempfile : csv_file
          results = CsvImportService.new(current_institution, file_io).call
          render_success({
            imported: results[:success],
            failed:   results[:failed],
            errors:   results[:errors]
          }, status: :created)
        rescue => e
          render_error("CSV 처리 중 오류: #{e.message}")
        end

        # GET /api/v1/institutions/passengers/csv_template (CSV 양식 다운로드)
        def csv_template
          csv_data = CsvImportService.template_csv
          send_data "\xEF\xBB\xBF#{csv_data}",
                    filename:    "passengers_template.csv",
                    type:        "text/csv; charset=utf-8",
                    disposition: "attachment"
        end

        # PATCH /api/v1/institutions/passengers/:id
        def update
          if @passenger.update(passenger_params)
            render_success(passenger_json(@passenger))
          else
            render_error("승객 수정 실패", errors: @passenger.errors.full_messages)
          end
        end

        # DELETE /api/v1/institutions/passengers/:id
        def destroy
          @passenger.update!(is_active: false)
          render_success({ message: "승객이 비활성화되었습니다" })
        end

        private

        def current_institution
          current_user.institution
        end

        def set_passenger
          @passenger = current_institution.passengers.find(params[:id])
        rescue ActiveRecord::RecordNotFound
          render_error("승객을 찾을 수 없습니다", status: :not_found)
        end

        def passenger_params
          params.require(:passenger).permit(
            :name, :phone, :pickup_address, :pickup_lat, :pickup_lng,
            :dropoff_address, :dropoff_lat, :dropoff_lng, :guardian_phone
          )
        end

        def passenger_json(passenger)
          {
            id: passenger.id,
            name: passenger.name,
            phone: passenger.phone,
            pickup_address: passenger.pickup_address,
            pickup_lat: passenger.pickup_lat,
            pickup_lng: passenger.pickup_lng,
            dropoff_address: passenger.dropoff_address,
            guardian_phone: passenger.guardian_phone,
            is_active: passenger.is_active
          }
        end
      end
    end
  end
end
