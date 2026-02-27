class Roster < ApplicationRecord
  enum :shuttle_type, {
    morning: 0,
    evening: 1,
    temporary: 2
  }

  belongs_to :institution
  belongs_to :vehicle
  has_many :roster_passengers, dependent: :destroy
  has_many :passengers, through: :roster_passengers
  has_many :trips, dependent: :destroy

  validates :week_start_date, presence: true
  validates :shuttle_type, presence: true

  scope :for_week, ->(date) { where(week_start_date: date.beginning_of_week) }
end
