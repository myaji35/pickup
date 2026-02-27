Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  # ActionCable WebSocket
  mount ActionCable.server => "/cable"

  namespace :api do
    namespace :v1 do
      # 인증
      scope :auth do
        post   "login",   to: "auth#login"
        post   "refresh", to: "auth#refresh"
        get    "me",      to: "auth#me"
        delete "logout",  to: "auth#logout"
      end

      # SUPER_ADMIN 전용
      namespace :admin do
        resources :institutions, only: [:index, :show] do
          collection do
            get :pending
            get :stats
          end
          member do
            post :approve
            post :reject
            post :suspend
            post :reactivate
          end
        end

        resources :plans, only: [:index, :show, :create, :update, :destroy]
        resources :users, only: [:index, :show, :create, :update, :destroy]
      end

      # INSTITUTION_ADMIN 전용
      namespace :institutions do
        resources :vehicles, only: [:index, :show, :create, :update, :destroy]

        resources :passengers, only: [:index, :show, :create, :update, :destroy] do
          collection do
            post :bulk_import    # CSV 업로드
            get  :csv_template   # CSV 양식 다운로드
          end
        end

        resources :rosters, only: [:index, :show, :create, :update, :destroy] do
          member do
            post   :copy_from_previous          # 이전 주 명단 복사
            post   :add_passenger               # 승객 추가
            delete "remove_passenger/:passenger_id", action: :remove_passenger  # 승객 제거
          end
        end
      end

      # INSTITUTION_ADMIN 전용 - 실시간 위치 조회
      namespace :institutions do
        # 운행 중 차량 위치 목록 (폴링 fallback)
        get  "vehicle_locations",          to: "vehicle_locations#index"
        get  "vehicle_locations/:trip_id", to: "vehicle_locations#show", as: :institution_vehicle_location

        # 안전 대시보드
        scope :safety do
          get  "scores",            to: "safety#scores"
          get  "events",            to: "safety#events"
          get  "summary",           to: "safety#summary"
          get  "dtc_history",       to: "safety#dtc_history"
          patch "dtc_history/:id/acknowledge", to: "safety#acknowledge_dtc", as: :acknowledge_dtc
        end
      end

      # 보호자/승객 전용
      namespace :guardian do
        # 회원가입 (초대 코드 기반)
        scope :auth do
          post "register",   to: "auth#register"
          post "fcm_token",  to: "auth#update_fcm_token"
        end

        # 내 승객 운행 조회
        resources :trips, only: [] do
          collection do
            get :active   # 현재 운행 중인 trip
          end
        end
        get  "trips",              to: "trips#index"
        post "trips/:trip_id/cancel", to: "trips#cancel", as: :guardian_cancel_trip

        # 프로필
        get "profile", to: "profile#show"
      end

      # DRIVER 전용
      namespace :driver do
        resources :trips, only: [:index, :show] do
          member do
            post :start
            post :end
            post :update_location   # GPS + OBD 위치 업데이트 (→ ActionCable 브로드캐스트)
            post :report_dtc        # DTC 오류 코드 보고
          end
        end
        resources :check_ins, only: [] do
          member do
            post :board
            post :alight
          end
        end
      end
    end
  end
end
