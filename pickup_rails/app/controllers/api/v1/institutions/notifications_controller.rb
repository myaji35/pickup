module Api
  module V1
    module Institutions
      # 알림 발송 이력 조회 — Epic 14
      class NotificationsController < ApplicationController
        before_action :require_institution_admin!

        # GET /api/v1/institutions/notifications
        def index
          logs = NotificationLog
                   .where(institution: current_institution)
                   .order(created_at: :desc)
                   .limit(200)

          render_success(logs.map { |l| log_json(l) })
        end

        # GET /api/v1/institutions/notifications/stats
        def stats
          since = 7.days.ago
          logs  = NotificationLog.where(institution: current_institution, created_at: since..)

          by_type = logs.group(:notification_type).count
          by_day  = logs.group("DATE(created_at)").count

          render_success({
            total_sent: logs.where(status: 'sent').count,
            total_failed: logs.where(status: 'failed').count,
            by_type: by_type,
            daily_counts: by_day.transform_keys(&:to_s).sort.to_h
          })
        end

        private

        def current_institution
          current_user.institution
        end

        def log_json(log)
          {
            id:                log.id,
            notification_type: log.notification_type,
            title:             log.title,
            body:              log.body,
            status:            log.status,
            created_at:        log.created_at.iso8601
          }
        end
      end
    end
  end
end
