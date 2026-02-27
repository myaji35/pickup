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
          collection { get :pending }
          collection { get :stats }
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
          collection { post :bulk_import }
        end
        resources :rosters, only: [:index, :show, :create, :update, :destroy] do
          member { post :copy_from_previous }
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
