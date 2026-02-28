module Api
  module V1
    module Institutions
      class ExpenseReceiptsController < ApplicationController
        before_action :require_institution_admin!

        # GET /api/v1/institutions/expense_receipts
        # params: vehicle_id, month (YYYY-MM), receipt_type, confirmed
        def index
          receipts = current_institution.vehicles
                                        .joins(:expense_receipts)
                                        .select('expense_receipts.*')

          receipts = ExpenseReceipt.where(vehicle: current_institution.vehicles)

          receipts = receipts.where(vehicle_id: params[:vehicle_id]) if params[:vehicle_id]
          receipts = receipts.where(receipt_type: params[:receipt_type]) if params[:receipt_type]
          receipts = receipts.where(confirmed: ActiveModel::Type::Boolean.new.cast(params[:confirmed])) if params.key?(:confirmed)

          if params[:month].present?
            date = Date.parse("#{params[:month]}-01")
            receipts = receipts.where(receipt_date: date.beginning_of_month..date.end_of_month)
          end

          receipts = receipts.order(receipt_date: :desc).limit(100)

          render json: { success: true, data: receipts.map { |r| serialize(r) } }
        end

        # POST /api/v1/institutions/expense_receipts
        # body: { vehicle_id, receipt_type, image_url, amount_krw?, vendor_name?, receipt_date? }
        def create
          vehicle = current_institution.vehicles.find(params.require(:vehicle_id))

          receipt = ExpenseReceipt.new(
            vehicle:      vehicle,
            driver:       current_user,
            receipt_type: params.require(:receipt_type),
            image_url:    params[:image_url],
            amount_krw:   params[:amount_krw],
            vendor_name:  params[:vendor_name],
            receipt_date: params[:receipt_date].present? ? Date.parse(params[:receipt_date]) : Date.today,
            ocr_status:   params[:image_url].present? ? 'pending' : 'done'
          )
          receipt.save!

          # OCR 비동기 처리 (image_url이 있을 때)
          if receipt.image_url.present? && receipt.ocr_status == 'pending'
            Thread.new do
              begin
                result = ClovaOcrService.extract(receipt.image_url)
                receipt.apply_ocr_result!(result.to_json)
              rescue => e
                receipt.update!(ocr_status: 'failed')
                Rails.logger.error "[OCR] 처리 실패: #{e.message}"
              end
            end
          end

          render json: { success: true, data: serialize(receipt) }, status: :created
        rescue => e
          render json: { success: false, error: e.message }, status: :unprocessable_entity
        end

        # PATCH /api/v1/institutions/expense_receipts/:id/confirm
        def confirm
          receipt = find_receipt
          receipt.update!(confirmed: true)
          render json: { success: true, data: serialize(receipt) }
        end

        # DELETE /api/v1/institutions/expense_receipts/:id
        def destroy
          find_receipt.destroy!
          render json: { success: true }
        end

        # GET /api/v1/institutions/settlements
        def settlements
          year  = params[:year]&.to_i  || Date.today.year
          month = params[:month]&.to_i || Date.today.month

          vehicles = current_institution.vehicles
          data = vehicles.map do |v|
            MonthlySettlement.calculate!(
              institution: current_institution,
              vehicle: v,
              year: year,
              month: month
            )
          end

          render json: { success: true, data: data.map { |s| serialize_settlement(s) } }
        end

        private

        def current_institution
          current_user.institution
        end

        def find_receipt
          ExpenseReceipt.joins(:vehicle)
                        .where(vehicles: { institution_id: current_institution.id })
                        .find(params[:id])
        rescue ActiveRecord::RecordNotFound
          render json: { success: false, error: '영수증을 찾을 수 없습니다.' }, status: :not_found
          raise
        end

        def serialize(r)
          {
            id:           r.id,
            vehicle_id:   r.vehicle_id,
            receipt_type: r.receipt_type,
            type_label:   r.type_label,
            image_url:    r.image_url,
            amount_krw:   r.amount_krw,
            vendor_name:  r.vendor_name,
            receipt_date: r.receipt_date,
            ocr_status:   r.ocr_status,
            confirmed:    r.confirmed,
            created_at:   r.created_at
          }
        end

        def serialize_settlement(s)
          {
            id:                   s.id,
            vehicle_id:           s.vehicle_id,
            year:                 s.year,
            month:                s.month,
            period_label:         s.period_label,
            total_trips:          s.total_trips,
            total_distance_km:    s.total_distance_km,
            fuel_cost_krw:        s.fuel_cost_krw,
            maintenance_cost_krw: s.maintenance_cost_krw,
            toll_cost_krw:        s.toll_cost_krw,
            total_cost_krw:       s.total_cost_krw,
            status:               s.status
          }
        end
      end
    end
  end
end
