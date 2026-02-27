class NotificationLog < ApplicationRecord
  belongs_to :user,        optional: true
  belongs_to :institution, optional: true

  TYPES = %w[
    trip_started
    boarded
    alighted
    eta_approaching
    dtc_alert
    reservation_confirmed
  ].freeze

  validates :notification_type, inclusion: { in: TYPES }
  validates :title, :body, presence: true

  scope :recent, -> { order(created_at: :desc).limit(100) }

  def data_hash
    JSON.parse(data.presence || '{}')
  rescue JSON::ParserError
    {}
  end
end
