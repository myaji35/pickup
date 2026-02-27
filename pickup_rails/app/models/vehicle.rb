class Vehicle < ApplicationRecord
  enum :status, {
    available: 0,
    maintenance: 1,
    retired: 2
  }

  belongs_to :institution
  has_one :driver_user, class_name: "User", foreign_key: :vehicle_id  # 기사 배정
  has_many :rosters
  has_many :trips

  validates :plate_number, presence: true, uniqueness: true
  validates :capacity, presence: true, numericality: { greater_than: 0 }

  before_validation :extract_plate_last4

  scope :available_for_institution, ->(institution_id) {
    where(institution_id: institution_id, status: :available)
  }

  private

  def extract_plate_last4
    self.plate_last4 = plate_number&.last(4)
  end
end
