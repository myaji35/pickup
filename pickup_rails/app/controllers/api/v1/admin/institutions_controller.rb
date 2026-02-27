module Api
  module V1
    module Admin
      class InstitutionsController < ApplicationController
        before_action :require_super_admin!
        before_action :set_institution, only: [:show, :approve, :reject, :suspend, :reactivate]

        # GET /api/v1/admin/institutions
        def index
          institutions = Institution.includes(:institution_type, :subscriptions)
          institutions = institutions.where(status: params[:status]) if params[:status].present?
          institutions = institutions.where("name LIKE ? OR business_number LIKE ?",
                                            "%#{params[:q]}%", "%#{params[:q]}%") if params[:q].present?
          institutions = institutions.order(created_at: :desc).page(params[:page]).per(params[:per_page] || 20)

          render_success(
            institutions.map { |i| institution_json(i) },
            meta: pagination_meta(institutions)
          )
        end

        # GET /api/v1/admin/institutions/pending
        def pending
          institutions = Institution.pending_approval
                                    .includes(:institution_type)
                                    .page(params[:page]).per(20)
          render_success(institutions.map { |i| institution_json(i) }, meta: pagination_meta(institutions))
        end

        # GET /api/v1/admin/institutions/:id
        def show
          render_success(institution_detail_json(@institution))
        end

        # POST /api/v1/admin/institutions/:id/approve
        def approve
          if @institution.pending?
            @institution.approve!(current_user)
            render_success(institution_json(@institution))
          else
            render_error("승인 대기 상태의 기관만 승인할 수 있습니다")
          end
        end

        # POST /api/v1/admin/institutions/:id/reject
        def reject
          if @institution.pending?
            @institution.reject!(params[:reason])
            render_success(institution_json(@institution))
          else
            render_error("승인 대기 상태의 기관만 거부할 수 있습니다")
          end
        end

        # POST /api/v1/admin/institutions/:id/suspend
        def suspend
          if @institution.active?
            @institution.suspend!(params[:reason])
            render_success(institution_json(@institution))
          else
            render_error("활성 상태의 기관만 정지할 수 있습니다")
          end
        end

        # POST /api/v1/admin/institutions/:id/reactivate
        def reactivate
          if @institution.suspended?
            @institution.reactivate!
            render_success(institution_json(@institution))
          else
            render_error("정지 상태의 기관만 재활성화할 수 있습니다")
          end
        end

        # GET /api/v1/admin/stats
        def stats
          render_success({
            total_institutions: Institution.count,
            pending_count: Institution.pending.count,
            active_count: Institution.active.count,
            suspended_count: Institution.suspended.count,
            total_vehicles: Vehicle.count,
            total_passengers: Passenger.active.count,
            new_this_month: Institution.where(created_at: Time.current.beginning_of_month..).count
          })
        end

        private

        def set_institution
          @institution = Institution.find(params[:id])
        rescue ActiveRecord::RecordNotFound
          render_error("기관을 찾을 수 없습니다", status: :not_found)
        end

        def institution_json(institution)
          {
            id: institution.id,
            name: institution.name,
            business_number: institution.business_number,
            address: institution.address,
            phone: institution.phone,
            status: institution.status,
            institution_type: institution.institution_type&.type_name,
            approved_at: institution.approved_at,
            suspended_at: institution.suspended_at,
            suspension_reason: institution.suspension_reason,
            created_at: institution.created_at
          }
        end

        def institution_detail_json(institution)
          institution_json(institution).merge(
            users_count: institution.users.count,
            vehicles_count: institution.vehicles.count,
            passengers_count: institution.passengers.active.count,
            rejection_reason: institution.rejection_reason,
            approved_by: institution.approved_by&.name,
            current_plan: institution.subscriptions.where(status: [:trial, :active]).first&.plan&.name
          )
        end
      end
    end
  end
end
