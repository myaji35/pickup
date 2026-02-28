module Api
  module V1
    module Institutions
      class CompanionCheckInsController < ApplicationController
        before_action :require_institution_admin!

        # GET /api/v1/institutions/trips/:trip_id/companion_check_ins
        # 동승자(보호자/관리자)가 사용하는 원터치 승하차용 체크인 목록
        def index
          trip = find_trip
          return unless trip

          data = trip.check_ins
                     .includes(:passenger)
                     .order(:id)
                     .map { |ci| serialize(ci) }

          render json: { success: true, data: data }
        end

        # POST /api/v1/institutions/trips/:trip_id/companion_check_ins/:id/board
        def board
          trip = find_trip
          return unless trip

          check_in = trip.check_ins.find_by(id: params[:id])
          return render json: { success: false, error: '체크인 정보를 찾을 수 없습니다.' }, status: :not_found unless check_in
          return render json: { success: false, error: '이미 탑승 처리된 승객입니다.' }, status: :unprocessable_entity unless check_in.pending?

          check_in.update!(source: 'companion') if check_in.respond_to?(:source=)
          check_in.board!
          FcmNotificationService.notify_boarded(check_in) rescue nil

          render json: { success: true, data: serialize(check_in) }
        end

        # POST /api/v1/institutions/trips/:trip_id/companion_check_ins/:id/alight
        def alight
          trip = find_trip
          return unless trip

          check_in = trip.check_ins.find_by(id: params[:id])
          return render json: { success: false, error: '체크인 정보를 찾을 수 없습니다.' }, status: :not_found unless check_in
          return render json: { success: false, error: '탑승 상태가 아닙니다.' }, status: :unprocessable_entity unless check_in.boarded?

          check_in.alight!
          FcmNotificationService.notify_alighted(check_in) rescue nil

          render json: { success: true, data: serialize(check_in) }
        end

        private

        def find_trip
          Trip.joins(roster: :institution)
              .where(rosters: { institution_id: current_institution.id })
              .includes(check_ins: :passenger)
              .find(params[:trip_id])
        rescue ActiveRecord::RecordNotFound
          render json: { success: false, error: '운행 정보를 찾을 수 없습니다.' }, status: :not_found
          nil
        end

        def current_institution
          @current_institution ||= current_user.institution
        end

        def serialize(ci)
          {
            id:             ci.id,
            passenger_id:   ci.passenger_id,
            passenger_name: ci.passenger.name,
            guardian_name:  ci.passenger.guardians.first&.user&.name,
            status:         ci.status,
            source:         ci.source,
            boarded_at:     ci.boarded_at,
            alighted_at:    ci.alighted_at
          }
        end
      end
    end
  end
end
