module Api
  module V1
    class AuthController < ApplicationController
      skip_before_action :authenticate_user!, only: [:login, :refresh]

      # POST /api/v1/auth/login
      def login
        user = User.find_by(email: params[:email]&.downcase)

        if user&.authenticate(params[:password]) && user.is_active
          unless user.institution&.active? || user.super_admin?
            return render_error("소속 기관이 활성 상태가 아닙니다", status: :forbidden)
          end

          user.update_column(:last_login_at, Time.current)
          render_success(auth_response(user), status: :ok)
        else
          render_error("이메일 또는 비밀번호가 올바르지 않습니다", status: :unauthorized)
        end
      end

      # POST /api/v1/auth/refresh
      def refresh
        payload = JwtService.decode(params[:refresh_token])
        user = User.find(payload[:user_id])
        render_success(auth_response(user))
      rescue AuthenticationError, ActiveRecord::RecordNotFound => e
        render_unauthorized(e.message)
      end

      # GET /api/v1/auth/me
      def me
        render_success(user_json(current_user))
      end

      # DELETE /api/v1/auth/logout
      def logout
        render json: { success: true, message: "로그아웃 되었습니다" }
      end

      private

      def auth_response(user)
        {
          access_token: JwtService.encode({ user_id: user.id, role: user.role }),
          refresh_token: JwtService.encode_refresh({ user_id: user.id }),
          user: user_json(user)
        }
      end

      def user_json(user)
        {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          institution_id: user.institution_id,
          institution_name: user.institution&.name
        }
      end
    end
  end
end
