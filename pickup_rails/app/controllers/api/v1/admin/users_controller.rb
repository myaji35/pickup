module Api
  module V1
    module Admin
      class UsersController < ApplicationController
        before_action :require_super_admin!
        before_action :set_user, only: [:show, :update, :destroy]

        # GET /api/v1/admin/users
        def index
          users = User.order(created_at: :desc).page(params[:page]).per(params[:per_page] || 20)
          users = users.where(role: params[:role]) if params[:role].present?
          render_success(
            users.map { |u| user_json(u) },
            meta: pagination_meta(users)
          )
        end

        # GET /api/v1/admin/users/:id
        def show
          render_success(user_json(@user))
        end

        # POST /api/v1/admin/users
        def create
          user = User.new(user_params)
          if user.save
            render_success(user_json(user), status: :created)
          else
            render_error(user.errors.full_messages.join(', '), status: :unprocessable_entity)
          end
        end

        # PATCH /api/v1/admin/users/:id
        def update
          update_attrs = user_params.to_h
          # 비밀번호 변경
          if update_attrs[:password].present?
            @user.password = update_attrs[:password]
          end
          update_attrs.delete(:password)

          if @user.update(update_attrs) && @user.save
            render_success(user_json(@user))
          else
            render_error(@user.errors.full_messages.join(', '), status: :unprocessable_entity)
          end
        end

        # DELETE /api/v1/admin/users/:id
        def destroy
          @user.destroy
          render_success({ message: '사용자가 삭제되었습니다.' })
        end

        private

        def set_user
          @user = User.find(params[:id])
        rescue ActiveRecord::RecordNotFound
          render_error('사용자를 찾을 수 없습니다.', status: :not_found)
        end

        def user_params
          params.require(:user).permit(:email, :name, :password, :role, :institution_id)
        end

        def user_json(user)
          {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            institution_id: user.institution_id,
            institution_name: user.institution&.name,
            created_at: user.created_at
          }
        end
      end
    end
  end
end
