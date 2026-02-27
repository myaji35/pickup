module Api
  module V1
    module Guardian
      # 보호자 회원가입 / FCM 토큰 등록
      class AuthController < ApplicationController
        before_action :authenticate!, only: [:update_fcm_token]

        # POST /api/v1/guardian/auth/register
        # { email, password, name, invite_code, relationship }
        def register
          invite_code = params[:invite_code].to_s.strip
          passenger   = Passenger.find_by(invite_code: invite_code)

          return render_error("유효하지 않은 초대 코드입니다", status: :unprocessable_entity) unless passenger

          ActiveRecord::Base.transaction do
            user = User.new(
              email:       params[:email],
              password:    params[:password],
              name:        params[:name],
              role:        :passenger,
              institution: passenger.institution,
              is_active:   true
            )
            user.save!

            Guardian.create!(
              user:         user,
              passenger:    passenger,
              relationship: params[:relationship].presence || 'parent'
            )

            tokens = JwtService.issue_tokens(user)
            render_success({
              access_token:  tokens[:access_token],
              refresh_token: tokens[:refresh_token],
              user: {
                id:          user.id,
                name:        user.name,
                email:       user.email,
                passenger: {
                  id:   passenger.id,
                  name: passenger.name
                }
              }
            }, status: :created)
          end
        rescue ActiveRecord::RecordInvalid => e
          render_error(e.message, status: :unprocessable_entity)
        end

        # POST /api/v1/guardian/auth/fcm_token
        # { token }
        def update_fcm_token
          current_user.update!(fcm_token: params[:token])
          render_success({ message: "FCM 토큰이 등록되었습니다" })
        end
      end
    end
  end
end
