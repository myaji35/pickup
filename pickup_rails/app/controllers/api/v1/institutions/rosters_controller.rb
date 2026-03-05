module Api
  module V1
    module Institutions
      class RostersController < ApplicationController
        before_action :require_institution_admin!
        before_action :set_roster, only: [:show, :update, :destroy, :copy_from_previous, :add_passenger, :remove_passenger]

        # GET /api/v1/institutions/rosters
        # params: week_start_date (YYYY-MM-DD), vehicle_id, shuttle_type
        def index
          rosters = current_institution.rosters.includes(:vehicle, :passengers)

          rosters = rosters.for_week(Date.parse(params[:week_start_date])) if params[:week_start_date].present?
          rosters = rosters.where(vehicle_id: params[:vehicle_id])          if params[:vehicle_id].present?
          rosters = rosters.where(shuttle_type: params[:shuttle_type])      if params[:shuttle_type].present?

          rosters = rosters.order(week_start_date: :desc, shuttle_type: :asc)
                           .page(params[:page]).per(20)

          render_success(rosters.map { |r| roster_json(r) }, meta: pagination_meta(rosters))
        end

        # GET /api/v1/institutions/rosters/:id
        def show
          render_success(roster_detail_json(@roster))
        end

        # POST /api/v1/institutions/rosters
        def create
          roster = current_institution.rosters.build(roster_params)

          # 중복 체크 (같은 주+차량+셔틀타입)
          if current_institution.rosters.exists?(
               week_start_date: roster.week_start_date,
               vehicle_id: roster.vehicle_id,
               shuttle_type: roster.shuttle_type
             )
            return render_error("이미 동일한 명단이 존재합니다 (주차+차량+셔틀타입)")
          end

          if roster.save
            # passenger_ids 가 제공된 경우 일괄 추가
            add_passengers_to_roster(roster, params[:passenger_ids]) if params[:passenger_ids].present?
            render_success(roster_detail_json(roster.reload), status: :created)
          else
            render_error("명단 생성 실패", errors: roster.errors.full_messages)
          end
        end

        # PATCH /api/v1/institutions/rosters/:id
        def update
          if @roster.update(roster_params)
            render_success(roster_detail_json(@roster.reload))
          else
            render_error("명단 수정 실패", errors: @roster.errors.full_messages)
          end
        end

        # DELETE /api/v1/institutions/rosters/:id
        def destroy
          @roster.destroy
          render_success({ message: "명단이 삭제되었습니다" })
        end

        # POST /api/v1/institutions/rosters/:id/copy_from_previous
        # 이전 주 명단을 새 주로 복사
        def copy_from_previous
          target_week = params[:target_week_start_date].present? ?
            Date.parse(params[:target_week_start_date]) :
            @roster.week_start_date + 7.days

          # 이미 존재하는지 확인
          if current_institution.rosters.exists?(
               week_start_date: target_week,
               vehicle_id: @roster.vehicle_id,
               shuttle_type: @roster.shuttle_type
             )
            return render_error("대상 주차에 이미 명단이 존재합니다")
          end

          new_roster = current_institution.rosters.create!(
            vehicle_id:      @roster.vehicle_id,
            week_start_date: target_week,
            shuttle_type:    @roster.shuttle_type
          )

          # 기존 승객 목록 복사 (활성 승객만)
          active_passenger_ids = @roster.passengers.where(is_active: true).pluck(:id)
          add_passengers_to_roster(new_roster, active_passenger_ids)

          render_success(
            roster_detail_json(new_roster.reload),
            status: :created
          )
        end

        # POST /api/v1/institutions/rosters/:id/passengers  (승객 추가)
        def add_passenger
          passenger = current_institution.passengers.find(params[:passenger_id])

          if @roster.roster_passengers.exists?(passenger_id: passenger.id)
            return render_error("이미 명단에 포함된 승객입니다")
          end

          @roster.roster_passengers.create!(passenger: passenger)
          render_success(roster_detail_json(@roster.reload))
        rescue ActiveRecord::RecordNotFound
          render_error("승객을 찾을 수 없습니다", status: :not_found)
        end

        # DELETE /api/v1/institutions/rosters/:id/passengers/:passenger_id  (승객 제거)
        def remove_passenger
          rp = @roster.roster_passengers.find_by(passenger_id: params[:passenger_id])
          return render_error("명단에 해당 승객이 없습니다") unless rp

          rp.destroy
          render_success(roster_detail_json(@roster.reload))
        end

        private

        def current_institution
          current_user.institution
        end

        def set_roster
          @roster = current_institution.rosters.find(params[:id])
        rescue ActiveRecord::RecordNotFound
          render_error("명단을 찾을 수 없습니다", status: :not_found)
        end

        def roster_params
          params.require(:roster).permit(:vehicle_id, :week_start_date, :shuttle_type, :departure_address, :departure_time)
        end

        def add_passengers_to_roster(roster, passenger_ids)
          Array(passenger_ids).each do |pid|
            next if roster.roster_passengers.exists?(passenger_id: pid)
            passenger = current_institution.passengers.find_by(id: pid)
            roster.roster_passengers.create!(passenger: passenger) if passenger
          end
        end

        def roster_json(roster)
          {
            id:               roster.id,
            week_start_date:  roster.week_start_date,
            shuttle_type:     roster.shuttle_type,
            vehicle:          {
              id:           roster.vehicle.id,
              plate_last4:  roster.vehicle.plate_last4,
              plate_number: roster.vehicle.plate_number,
              capacity:     roster.vehicle.capacity
            },
            passengers_count:   roster.passengers.count,
            departure_address:    roster.departure_address,
            departure_time:       roster.departure_time,
            last_optimized_at:    roster.last_optimized_at,
            optimized_distance_m: roster.optimized_distance_m,
            created_at:           roster.created_at
          }
        end

        def roster_detail_json(roster)
          roster_json(roster).merge(
            passengers: roster.passengers.map do |p|
              {
                id:              p.id,
                name:            p.name,
                phone:           p.phone,
                pickup_address:  p.pickup_address,
                dropoff_address: p.dropoff_address,
                is_active:       p.is_active
              }
            end
          )
        end
      end
    end
  end
end
