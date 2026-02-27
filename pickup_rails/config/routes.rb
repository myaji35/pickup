Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

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

      # DRIVER 전용
      namespace :driver do
        resources :trips, only: [:index, :show] do
          member do
            post :start
            post :end
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
