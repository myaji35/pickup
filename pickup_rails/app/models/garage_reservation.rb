class GarageReservation < ApplicationRecord
  STATUSES = %w[pending confirmed completed cancelled].freeze

  belongs_to :partner_garage
  belongs_to :institution
  belongs_to :vehicle
  belongs_to :dtc_report, optional: true
  has_one    :referral_reward, dependent: :destroy

  validates :status,        inclusion: { in: STATUSES }
  validates :reserved_date, presence: true

  scope :recent,   -> { order(created_at: :desc) }
  scope :upcoming, -> { where(status: %w[pending confirmed]).where("reserved_date >= ?", Date.today) }

  after_create :create_referral_reward_record

  private

  def create_referral_reward_record
    ReferralReward.create!(
      garage_reservation: self,
      amount_krw:         referral_fee_krw.positive? ? referral_fee_krw : 5000,
      status:             'pending',
    )
  end
end
