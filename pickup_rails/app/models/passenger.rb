class Passenger < ApplicationRecord
  belongs_to :institution
  has_many :roster_passengers, dependent: :destroy
  has_many :rosters, through: :roster_passengers
  has_many :passenger_schedules, dependent: :destroy
  has_many :check_ins, dependent: :destroy

  validates :name, presence: true
  validates :pickup_address, presence: true

  scope :active, -> { where(is_active: true) }
  scope :for_institution, ->(institution_id) { where(institution_id: institution_id) }
end
