class ReferralReward < ApplicationRecord
  belongs_to :garage_reservation

  STATUSES = %w[pending paid].freeze
  validates :status, inclusion: { in: STATUSES }
  validates :amount_krw, numericality: { greater_than_or_equal_to: 0 }

  scope :pending, -> { where(status: 'pending') }
  scope :paid,    -> { where(status: 'paid') }
end
