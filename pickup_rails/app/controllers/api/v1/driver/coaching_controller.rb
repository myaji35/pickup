module Api
  module V1
    module Driver
      # CoachingController — 드라이버 앱 코칭 & 배지 API
      class CoachingController < ApplicationController
        # GET /api/v1/driver/coaching/messages?unread_only=true
        def messages
          msgs = CoachingMessage.for_driver(current_user)
          msgs = msgs.unread if params[:unread_only] == 'true'
          msgs = msgs.limit(50)

          render json: {
            unread_count: CoachingMessage.for_driver(current_user).unread.count,
            messages: msgs.map { |m| serialize_message(m) }
          }
        end

        # PATCH /api/v1/driver/coaching/messages/:id/read
        def mark_read
          msg = CoachingMessage.for_driver(current_user).find(params[:id])
          msg.update!(read: true)
          render json: { id: msg.id, read: true }
        rescue ActiveRecord::RecordNotFound
          render json: { error: '메시지를 찾을 수 없습니다.' }, status: :not_found
        end

        # PATCH /api/v1/driver/coaching/messages/read_all
        def mark_all_read
          count = CoachingMessage.for_driver(current_user).unread.update_all(read: true)
          render json: { marked_read: count }
        end

        # GET /api/v1/driver/coaching/badges
        def badges
          badges = DriverBadge.for_driver(current_user)
          render json: {
            total: badges.count,
            badges: badges.map { |b| serialize_badge(b) }
          }
        end

        # GET /api/v1/driver/coaching/summary
        def summary
          # 현재 주 안전 점수
          current_score = DriverSafetyScore
            .where(driver: current_user)
            .order(period_year: :desc, period_week: :desc)
            .first

          # 최근 주간 요약
          recent_summary = WeeklyCoachingSummary
            .where(driver: current_user)
            .order(week_start: :desc)
            .first

          # 최근 30일 이벤트 통계
          event_stats = DrivingEvent
            .joins(:trip)
            .where(trips: { driver_id: current_user.id })
            .where(created_at: 30.days.ago..)
            .group(:event_type)
            .count

          render json: {
            safety_score: current_score ? {
              overall_score: current_score.total_score,
              grade:         case current_score.total_score.to_f
                             when 90..100 then 'A'
                             when 80..89  then 'B'
                             when 70..79  then 'C'
                             else 'D'
                             end,
              period:        "#{current_score.period_year}-W#{current_score.period_week.to_s.rjust(2,'0')}"
            } : nil,
            event_stats_30d: event_stats,
            badge_count:     DriverBadge.where(driver: current_user).count,
            unread_coaching: CoachingMessage.for_driver(current_user).unread.count,
            weekly_summary:  recent_summary ? {
              week_start:       recent_summary.week_start.to_s,
              total_trips:      recent_summary.total_trips,
              avg_score:        recent_summary.avg_score,
              badges_earned:    recent_summary.badges_earned,
              improvement_tips: recent_summary.improvement_tips_array,
              praise_points:    recent_summary.praise_points_array
            } : nil
          }
        end

        private

        def serialize_message(m)
          {
            id:            m.id,
            trigger_event: m.trigger_event,
            message_type:  m.message_type,
            severity:      m.severity,
            content:       m.content,
            read:          m.read,
            trip_id:       m.trip_id,
            created_at:    m.created_at
          }
        end

        def serialize_badge(b)
          {
            id:         b.id,
            badge_type: b.badge_type,
            label:      b.label,
            level:      b.level,
            color:      b.color,
            earned_on:  b.earned_on.to_s
          }
        end
      end
    end
  end
end
