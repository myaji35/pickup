class CoachingMessage < ApplicationRecord
  TRIGGER_EVENTS = %w[harsh_braking harsh_acceleration speeding dtc_alert trip_completed weekly_summary].freeze
  MESSAGE_TYPES  = %w[tip warning praise summary].freeze
  SEVERITIES     = %w[info warning critical].freeze

  belongs_to :driver, class_name: 'User'
  belongs_to :trip, optional: true

  validates :trigger_event, inclusion: { in: TRIGGER_EVENTS }
  validates :message_type,  inclusion: { in: MESSAGE_TYPES }
  validates :severity,      inclusion: { in: SEVERITIES }
  validates :content, presence: true

  scope :unread,      -> { where(read: false) }
  scope :for_driver,  ->(d) { where(driver: d).order(created_at: :desc) }
  scope :recent,      -> { order(created_at: :desc) }
end
