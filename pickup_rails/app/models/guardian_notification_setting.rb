class GuardianNotificationSetting < ApplicationRecord
  NOTIF_TYPES = %w[trip_started eta_before_boarding boarded eta_before_alighting alighted].freeze

  DEFAULT_TEMPLATES = {
    'trip_started'          => '{{기관명}} 차량이 운행을 시작했습니다.',
    'eta_before_boarding'   => '{{ETA분}}분 후 {{승객이름}}님 탑승 예정입니다.',
    'boarded'               => '{{승객이름}}님이 탑승하셨습니다.',
    'eta_before_alighting'  => '{{ETA분}}분 후 {{승객이름}}님 하차 예정입니다.',
    'alighted'              => '{{승객이름}}님이 하차하셨습니다.'
  }.freeze

  belongs_to :guardian

  validates :notif_type, inclusion: { in: NOTIF_TYPES }
  validates :guardian_id, uniqueness: { scope: :notif_type }

  # 보호자의 5개 알림 설정을 반환. 미설정 유형은 기본값으로 채워서 반환.
  def self.defaults_for(guardian)
    existing = where(guardian: guardian).index_by(&:notif_type)

    NOTIF_TYPES.map do |type|
      existing[type] || new(
        guardian: guardian,
        notif_type: type,
        enabled: true,
        template: nil
      )
    end
  end

  # 승객의 모든 보호자에 대해 5개 알림 설정을 반환 (Admin Portal용)
  # guardian_id 그룹핑 없이 단순히 첫 번째 보호자 기준으로 반환
  def self.defaults_for_passenger(passenger)
    guardian = passenger.guardians.first
    return [] unless guardian

    defaults_for(guardian)
  end

  def effective_template
    template.presence || DEFAULT_TEMPLATES[notif_type]
  end
end
