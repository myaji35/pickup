class FcmToken < ApplicationRecord
  belongs_to :user

  validates :token, presence: true, uniqueness: true
  validates :device_type, presence: true,
            inclusion: { in: %w[ios android web unknown] }

  # 토큰 등록/갱신 (upsert)
  def self.register(user:, token:, device_type: 'unknown')
    existing = find_by(token: token)
    if existing
      existing.update!(user: user, device_type: device_type, last_used_at: Time.current)
      existing
    else
      # 동일 user + device_type 의 이전 토큰 제거
      where(user: user, device_type: device_type).delete_all if device_type != 'unknown'
      create!(user: user, token: token, device_type: device_type, last_used_at: Time.current)
    end
  end
end
