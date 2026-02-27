module Api
  module V1
    module Institutions
      class NotificationSettingsController < ApplicationController
        before_action :authenticate_request!
        before_action :require_institution_admin!
        before_action :set_passenger

        # GET /api/v1/institutions/passengers/:id/notification_settings
        def show
          settings = GuardianNotificationSetting.defaults_for_passenger(@passenger)
          render json: {
            success: true,
            data: settings.map { |s| serialize_setting(s) }
          }
        end

        # PATCH /api/v1/institutions/passengers/:id/notification_settings
        def update
          items = params.require(:settings)

          ActiveRecord::Base.transaction do
            items.each do |item|
              notif_type = item[:notif_type]
              next unless GuardianNotificationSetting::NOTIF_TYPES.include?(notif_type)

              guardian = find_or_default_guardian(@passenger, item)
              next unless guardian

              setting = GuardianNotificationSetting.find_or_initialize_by(
                guardian: guardian,
                notif_type: notif_type
              )
              setting.enabled  = item[:enabled].nil? ? true : ActiveModel::Type::Boolean.new.cast(item[:enabled])
              setting.template = item[:template].presence
              setting.save!
            end
          end

          settings = GuardianNotificationSetting.defaults_for_passenger(@passenger)
          render json: {
            success: true,
            data: settings.map { |s| serialize_setting(s) }
          }
        rescue => e
          render json: { success: false, error: e.message }, status: :unprocessable_entity
        end

        private

        def set_passenger
          @passenger = current_institution.passengers.find(params[:passenger_id])
        rescue ActiveRecord::RecordNotFound
          render json: { success: false, error: '승객을 찾을 수 없습니다.' }, status: :not_found
        end

        def find_or_default_guardian(passenger, item)
          guardian_id = item[:guardian_id]
          if guardian_id.present?
            passenger.guardians.find_by(id: guardian_id)
          else
            # guardian_id 미전달 시 첫 번째 보호자 사용
            passenger.guardians.first
          end
        end

        def serialize_setting(setting)
          {
            guardian_id:     setting.guardian_id,
            notif_type:      setting.notif_type,
            enabled:         setting.enabled,
            template:        setting.template,
            default_template: GuardianNotificationSetting::DEFAULT_TEMPLATES[setting.notif_type]
          }
        end
      end
    end
  end
end
