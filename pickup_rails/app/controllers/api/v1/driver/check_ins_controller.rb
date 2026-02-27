module Api
  module V1
    module Driver
      class CheckInsController < ApplicationController
        before_action :require_driver!

        # POST /api/v1/driver/check_ins/:id/board
        # body: { source: "manual" | "qr" | "nfc" }
        def board
          check_in = find_check_in
          source = params[:source].presence_in(%w[manual qr nfc]) || "manual"
          check_in.update!(source: source) if check_in.respond_to?(:source=)
          check_in.board!
          FcmNotificationService.notify_boarded(check_in) rescue nil
          render_success({
            id:         check_in.id,
            status:     check_in.status,
            boarded_at: check_in.boarded_at,
            source:     source,
          })
        end

        # POST /api/v1/driver/check_ins/:id/alight
        def alight
          check_in = find_check_in
          check_in.alight!
          FcmNotificationService.notify_alighted(check_in) rescue nil
          render_success({ id: check_in.id, status: check_in.status, alighted_at: check_in.alighted_at })
        end

        # POST /api/v1/driver/check_ins/qr_scan
        # body: { qr_data: "<JSON from QR>", trip_id: 123 }
        # QR 스캔 → 승객 식별 → 체크인 자동 처리
        def qr_scan
          qr_data  = params[:qr_data].to_s
          trip_id  = params[:trip_id].to_i

          trip = Trip.joins(roster: :institution)
                     .where(driver_id: current_user.id, id: trip_id)
                     .first
          return render_error("운행 정보를 찾을 수 없습니다", :not_found) unless trip

          result = QrCodeService.verify(qr_data, institution_id: trip.roster.institution_id)
          return render_error(result[:error], :unprocessable_entity) unless result[:valid]

          check_in = CheckIn.find_by(trip_id: trip.id, passenger_id: result[:passenger_id])
          return render_error("이 차량의 탑승 대상이 아닙니다", :unprocessable_entity) unless check_in
          return render_error("이미 탑승 처리된 승객입니다", :unprocessable_entity) if check_in.boarded? || check_in.alighted?

          check_in.update!(source: "qr")
          check_in.board!
          FcmNotificationService.notify_boarded(check_in) rescue nil

          passenger = check_in.passenger
          render_success({
            id:             check_in.id,
            status:         check_in.status,
            boarded_at:     check_in.boarded_at,
            source:         "qr",
            passenger_name: passenger.name,
            passenger_id:   passenger.id,
          })
        end

        private

        def find_check_in
          CheckIn.joins(:trip).where(trips: { driver_id: current_user.id }).find(params[:id])
        rescue ActiveRecord::RecordNotFound
          render_error("체크인 정보를 찾을 수 없습니다", :not_found) and return
        end
      end
    end
  end
end
