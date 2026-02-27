class Passenger < ApplicationRecord
  belongs_to :institution
  has_many :roster_passengers, dependent: :destroy
  has_many :rosters, through: :roster_passengers
  has_many :passenger_schedules, dependent: :destroy
  has_many :check_ins, dependent: :destroy
  has_many :guardians, dependent: :destroy
  has_many :guardian_users, through: :guardians, source: :user

  validates :name, presence: true
  validates :pickup_address, presence: true

  before_create :generate_invite_code

  scope :active, -> { where(is_active: true) }
  scope :for_institution, ->(institution_id) { where(institution_id: institution_id) }

  private

  def generate_invite_code
    self.invite_code = loop do
      code = SecureRandom.alphanumeric(8).upcase
      break code unless Passenger.exists?(invite_code: code)
    end
  end
end
