class Subscription < ApplicationRecord
  enum :status, { trial: 0, active: 1, expired: 2, cancelled: 3 }

  belongs_to :institution
  belongs_to :plan

  validates :start_date, presence: true

  scope :active_for, ->(institution) {
    where(institution: institution, status: [:trial, :active])
    .order(created_at: :desc)
    .first
  }
end
