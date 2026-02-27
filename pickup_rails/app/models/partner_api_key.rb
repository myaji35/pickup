class PartnerApiKey < ApplicationRecord
  TYPES = %w[insurance garage_network].freeze

  validates :partner_name, presence: true
  validates :partner_type, inclusion: { in: TYPES }
  validates :api_key_digest, presence: true, uniqueness: true

  scope :active,    -> { where(active: true) }
  scope :insurance, -> { where(partner_type: 'insurance') }

  # raw 키로 digest 생성 후 저장
  def self.generate!(partner_name:, partner_type:)
    raw_key = "pk_#{SecureRandom.hex(24)}"
    digest  = Digest::SHA256.hexdigest(raw_key)
    record  = create!(
      partner_name:   partner_name,
      partner_type:   partner_type,
      api_key_digest: digest,
    )
    { raw_key: raw_key, record: record }
  end

  # 인증: raw key → digest 비교
  def self.authenticate(raw_key)
    return nil if raw_key.blank?
    digest = Digest::SHA256.hexdigest(raw_key)
    key = active.find_by(api_key_digest: digest)
    key&.touch(:last_used_at)
    key
  end
end
