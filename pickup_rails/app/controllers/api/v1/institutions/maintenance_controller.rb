module Api
  module V1
    module Institutions
      # MaintenanceController — 예측 정비 & 정비 기록 API
      class MaintenanceController < ApplicationController
        before_action :set_vehicle
        before_action :set_record, only: %i[show_record update_record destroy_record]

        # ──────────────────────────────────────────────
        # GET /api/v1/institutions/vehicles/:vehicle_id/maintenance/predictions
        # 차량 예측 정비 목록 조회 (없으면 즉시 생성)
        # ──────────────────────────────────────────────
        def predictions
          preds = @vehicle.maintenance_predictions.order(:component)

          if preds.empty? || preds.all? { |p| p.last_predicted_at < 1.hour.ago }
            MaintenancePredictionService.new(@vehicle).predict_all!
            preds = @vehicle.maintenance_predictions.reload.order(:component)
          end

          render json: {
            vehicle_id:    @vehicle.id,
            plate_number:  @vehicle.plate_number,
            current_mileage_km: @vehicle.current_mileage_km,
            predictions:   preds.map { |p| serialize_prediction(p) }
          }
        end

        # ──────────────────────────────────────────────
        # POST /api/v1/institutions/vehicles/:vehicle_id/maintenance/predictions/refresh
        # 예측 즉시 갱신
        # ──────────────────────────────────────────────
        def refresh_predictions
          results = MaintenancePredictionService.new(@vehicle).predict_all!
          preds   = @vehicle.maintenance_predictions.reload.order(:component)
          render json: {
            refreshed_at: Time.current,
            predictions:  preds.map { |p| serialize_prediction(p) }
          }
        end

        # ──────────────────────────────────────────────
        # GET /api/v1/institutions/vehicles/:vehicle_id/maintenance/records
        # 정비 기록 목록
        # ──────────────────────────────────────────────
        def records
          recs = @vehicle.maintenance_records.recent.limit(50)
          render json: recs.map { |r| serialize_record(r) }
        end

        # ──────────────────────────────────────────────
        # POST /api/v1/institutions/vehicles/:vehicle_id/maintenance/records
        # 정비 기록 등록
        # ──────────────────────────────────────────────
        def create_record
          rec = @vehicle.maintenance_records.build(record_params)
          rec.created_by_role = 'institution_admin'

          if rec.save
            # 해당 부품 예측을 즉시 갱신
            MaintenancePredictionService.new(@vehicle).predict_component!(rec.component)
            render json: serialize_record(rec), status: :created
          else
            render json: { errors: rec.errors.full_messages }, status: :unprocessable_entity
          end
        end

        # ──────────────────────────────────────────────
        # GET /api/v1/institutions/vehicles/:vehicle_id/maintenance/records/:id
        # ──────────────────────────────────────────────
        def show_record
          render json: serialize_record(@record)
        end

        # ──────────────────────────────────────────────
        # PATCH /api/v1/institutions/vehicles/:vehicle_id/maintenance/records/:id
        # ──────────────────────────────────────────────
        def update_record
          if @record.update(record_params)
            render json: serialize_record(@record)
          else
            render json: { errors: @record.errors.full_messages }, status: :unprocessable_entity
          end
        end

        # ──────────────────────────────────────────────
        # DELETE /api/v1/institutions/vehicles/:vehicle_id/maintenance/records/:id
        # ──────────────────────────────────────────────
        def destroy_record
          @record.destroy
          head :no_content
        end

        # ──────────────────────────────────────────────
        # PATCH /api/v1/institutions/vehicles/:vehicle_id/maintenance/mileage
        # 현재 주행거리 업데이트 (OBD 미연동 차량용 수동 입력)
        # ──────────────────────────────────────────────
        def update_mileage
          km = params[:current_mileage_km].to_i
          return render json: { error: '주행거리는 0 이상이어야 합니다.' }, status: :unprocessable_entity if km < 0

          @vehicle.update!(
            current_mileage_km: km,
            last_mileage_updated_at: Time.current
          )
          render json: { current_mileage_km: km, updated_at: Time.current }
        end

        private

        def set_vehicle
          @vehicle = current_institution.vehicles.find(params[:vehicle_id])
        rescue ActiveRecord::RecordNotFound
          render json: { error: '차량을 찾을 수 없습니다.' }, status: :not_found
        end

        def set_record
          @record = @vehicle.maintenance_records.find(params[:id])
        rescue ActiveRecord::RecordNotFound
          render json: { error: '정비 기록을 찾을 수 없습니다.' }, status: :not_found
        end

        def record_params
          params.require(:maintenance_record).permit(
            :component, :record_type, :performed_on,
            :mileage_km, :cost, :garage_name, :notes
          )
        end

        def serialize_prediction(p)
          {
            id:                 p.id,
            component:          p.component,
            status:             p.status,
            remaining_km:       p.remaining_km,
            remaining_days:     p.remaining_days,
            predicted_due_date: p.predicted_due_date,
            confidence_pct:     p.confidence_pct,
            basis:              p.basis,
            last_predicted_at:  p.last_predicted_at
          }
        end

        def serialize_record(r)
          {
            id:           r.id,
            component:    r.component,
            record_type:  r.record_type,
            performed_on: r.performed_on,
            mileage_km:   r.mileage_km,
            cost:         r.cost,
            garage_name:  r.garage_name,
            notes:        r.notes,
            created_by_role: r.created_by_role,
            created_at:   r.created_at
          }
        end
      end
    end
  end
end
