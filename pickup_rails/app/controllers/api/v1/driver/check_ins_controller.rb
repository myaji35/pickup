module Api
  module V1
    module Driver
      class CheckInsController < ApplicationController
        before_action :require_driver!

        # POST /api/v1/driver/check_ins/:id/board
        def board
          check_in = find_check_in
          check_in.board!
          render_success({ id: check_in.id, status: check_in.status, boarded_at: check_in.boarded_at })
        end

        # POST /api/v1/driver/check_ins/:id/alight
        def alight
          check_in = find_check_in
          check_in.alight!
          render_success({ id: check_in.id, status: check_in.status, alighted_at: check_in.alighted_at })
        end

        private

        def find_check_in
          # 드라이버 소유 확인 (trip을 통한 권한 검증)
          CheckIn.joins(:trip).where(trips: { driver_id: current_user.id }).find(params[:id])
        rescue ActiveRecord::RecordNotFound
          render_error("체크인 정보를 찾을 수 없습니다", status: :not_found) and return
        end
      end
    end
  end
end
