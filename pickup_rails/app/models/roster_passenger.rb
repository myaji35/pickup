class RosterPassenger < ApplicationRecord
  belongs_to :roster
  belongs_to :passenger
  has_many :trip_cancellations, dependent: :destroy
end
