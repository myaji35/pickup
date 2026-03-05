Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  # ActionCable WebSocket
  mount ActionCable.server => "/cable"

  namespace :api do
    namespace :v1 do
      # 인증
      scope :auth do
        post   "login",     to: "auth#login"
        post   "refresh",   to: "auth#refresh"
        get    "me",        to: "auth#me"
        delete "logout",    to: "auth#logout"
        post   "fcm_token", to: "auth#register_fcm_token"  # 공용 FCM 토큰 등록
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

        # 구독 관리 (슈퍼어드민)
        resources :subscriptions, only: [:index, :show] do
          member do
            patch :plan,     action: :change_plan
            post  :activate
            post  :suspend
            post  :cancel
            post  :charge
          end
        end
      end

      # INSTITUTION_ADMIN 전용
      namespace :institutions do
        resources :vehicles, only: [:index, :show, :create, :update, :destroy]

        resources :passengers, only: [:index, :show, :create, :update, :destroy] do
          collection do
            post :bulk_import    # CSV 업로드
            get  :csv_template   # CSV 양식 다운로드
          end
          member do
            get   :qr_code                  # QR 코드 PNG 다운로드
            get   :notification_settings,   to: 'notification_settings#show'
            patch :notification_settings,   to: 'notification_settings#update'
          end
        end

        resources :rosters, only: [:index, :show, :create, :update, :destroy] do
          member do
            post   :copy_from_previous          # 이전 주 명단 복사
            post   :add_passenger               # 승객 추가
            delete "remove_passenger/:passenger_id", action: :remove_passenger  # 승객 제거
            patch  :reorder_passengers          # 탑승자 순서 수동 변경
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

        # 결제 및 구독 관리
        scope :billing do
          get  "status",       to: "billing#status"
          post "register_card", to: "billing#register_card"
          get  "history",      to: "billing#history"
          get  "invoices",     to: "billing#invoices"
          post "change_plan",  to: "billing#change_plan"
        end

        # 경비 영수증 + 월별 정산 (Epic 6)
        resources :expense_receipts, only: [:index, :create, :destroy] do
          member do
            patch :confirm
          end
        end
        get 'settlements', to: 'expense_receipts#settlements'

        # 운행 이력 (Admin Portal)
        resources :trips, only: [:index, :show] do
          member do
            get :check_ins, to: 'trips#check_ins'
          end

          # 동승자 원터치 승하차 (Admin Portal)
          resources :companion_check_ins, only: [:index] do
            member do
              post :board
              post :alight
            end
          end
        end

        # BI 대시보드 집계
        scope :analytics do
          get "overview",   to: "analytics#overview"
          get "trips",      to: "analytics#trips"
          get "safety",     to: "analytics#safety"
          get "passengers", to: "analytics#passengers"
          get "export",     to: "analytics#export"
        end

        # AI 경로 최적화
        resources :rosters, only: [] do
          member do
            post :optimize,             to: "route_optimization#optimize"
            get  :route_preview,        to: "route_optimization#route_preview"
            post :apply_optimization,   to: "route_optimization#apply_optimization"
          end
        end
        post "eta", to: "route_optimization#eta"

        # 알림 이력 (Epic 14)
        scope :notifications do
          get '/',      to: 'notifications#index', as: :institution_notifications
          get 'stats',  to: 'notifications#stats',  as: :institution_notifications_stats
        end

        # 보험 리스크 리포트 (Epic 15-3)
        scope :risk_reports do
          get 'current',  to: 'risk_reports#current',  as: :institution_risk_current
          get 'monthly',  to: 'risk_reports#monthly',  as: :institution_risk_monthly
          get 'trend',    to: 'risk_reports#trend',    as: :institution_risk_trend
        end

        # 파트너십 — 정비소 추천 + 예약 (Epic 13)
        scope :garages do
          get  "nearby",                       to: "garages#nearby"
          get  "reservations",                 to: "garages#reservations"
          post ":id/reservations",             to: "garages#create_reservation"
        end

        # 예측 정비 (Epic 15)
        scope "vehicles/:vehicle_id/maintenance" do
          get  "predictions",         to: "maintenance#predictions",         as: :maintenance_predictions
          post "predictions/refresh", to: "maintenance#refresh_predictions", as: :refresh_maintenance_predictions
          get  "records",             to: "maintenance#records",             as: :maintenance_records
          post "records",             to: "maintenance#create_record"
          get  "records/:id",         to: "maintenance#show_record",         as: :maintenance_record
          patch "records/:id",        to: "maintenance#update_record"
          delete "records/:id",       to: "maintenance#destroy_record"
          patch "mileage",            to: "maintenance#update_mileage",      as: :maintenance_mileage
        end
      end

      # 파트너 외부 API (보험사 전용, X-Partner-Key 인증)
      namespace :partner do
        scope :insurance do
          get "safety_report", to: "insurance#safety_report"
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
        # 코칭 & 배지 (Epic 15-4)
        scope :coaching do
          get  'messages',             to: 'coaching#messages'
          patch 'messages/:id/read',   to: 'coaching#mark_read',    as: :driver_coaching_read
          patch 'messages/read_all',   to: 'coaching#mark_all_read', as: :driver_coaching_read_all
          get  'badges',               to: 'coaching#badges'
          get  'summary',              to: 'coaching#summary'
        end

        resources :trips, only: [:index, :show] do
          member do
            post :start
            post :end
            post :update_location   # GPS + OBD 위치 업데이트 (→ ActionCable 브로드캐스트)
            post :report_dtc        # DTC 오류 코드 보고
          end
        end
        resources :check_ins, only: [] do
          collection do
            post :qr_scan        # QR 스캔 → 승객 자동 체크인
          end
          member do
            post :board
            post :alight
          end
        end
      end
    end
  end
end
