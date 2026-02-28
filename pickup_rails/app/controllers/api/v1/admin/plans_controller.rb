module Api
  module V1
    module Admin
      class PlansController < ApplicationController
        before_action :require_super_admin!
        before_action :set_plan, only: [:show, :update, :destroy]

        # GET /api/v1/admin/plans
        def index
          plans = Plan.order(monthly_price: :asc)
          render_success(plans.map { |p| plan_json(p) })
        end

        # GET /api/v1/admin/plans/:id
        def show
          render_success(plan_json(@plan))
        end

        # POST /api/v1/admin/plans
        def create
          plan = Plan.new(plan_params)
          if plan.save
            render_success(plan_json(plan), status: :created)
          else
            render_error(plan.errors.full_messages.join(', '), status: :unprocessable_entity)
          end
        end

        # PATCH /api/v1/admin/plans/:id
        def update
          if @plan.update(plan_params)
            render_success(plan_json(@plan))
          else
            render_error(@plan.errors.full_messages.join(', '), status: :unprocessable_entity)
          end
        end

        # DELETE /api/v1/admin/plans/:id
        def destroy
          @plan.update(is_active: false)
          render_success({ message: '요금제가 비활성화되었습니다.' })
        end

        private

        def set_plan
          @plan = Plan.find(params[:id])
        rescue ActiveRecord::RecordNotFound
          render_error('요금제를 찾을 수 없습니다.', status: :not_found)
        end

        def plan_params
          params.require(:plan).permit(:name, :code, :monthly_price, :max_vehicles, :max_passengers, :features, :is_active)
        end

        def plan_json(plan)
          {
            id: plan.id,
            name: plan.name,
            code: plan.code,
            monthly_price: plan.monthly_price,
            max_vehicles: plan.max_vehicles,
            max_passengers: plan.max_passengers,
            features: plan.features,
            is_active: plan.is_active,
            created_at: plan.created_at
          }
        end
      end
    end
  end
end
