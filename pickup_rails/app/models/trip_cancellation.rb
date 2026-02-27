class TripCancellation < ApplicationRecord
  belongs_to :roster_passenger
  belongs_to :requested_by, class_name: 'User'

  validates :cancel_date, presence: true
  validates :roster_passenger_id, uniqueness: { scope: :cancel_date }
end
