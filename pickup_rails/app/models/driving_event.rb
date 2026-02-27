class DrivingEvent < ApplicationRecord
  belongs_to :trip
  belongs_to :driver, class_name: 'User'

  TYPES = %w[harsh_accel harsh_brake speeding idling].freeze

  validates :event_type, inclusion: { in: TYPES }
  validates :speed, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
end
