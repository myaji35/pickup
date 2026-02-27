module Api
  module V1
    module Guardian
      # 보호자 프로필 조회 / 수정
      class ProfileController < ApplicationController
        before_action :authenticate!

        # GET /api/v1/guardian/profile
        def show
          guardians = current_user.guardians.includes(:passenger)
          render_success({
            id:    current_user.id,
            name:  current_user.name,
            email: current_user.email,
            passengers: guardians.map { |g|
              {
                id:           g.passenger_id,
                name:         g.passenger.name,
                relationship: g.relationship,
                invite_code:  g.passenger.invite_code
              }
            }
          })
        end
      end
    end
  end
end
