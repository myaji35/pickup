class DtcReport < ApplicationRecord
  belongs_to :trip
  belongs_to :vehicle

  STATUSES = %w[pending acknowledged resolved].freeze

  validates :code,   presence: true, format: { with: /\A[PCBU]\d[0-9A-F]{3}\z/i }
  validates :status, inclusion: { in: STATUSES }

  scope :pending,      -> { where(status: 'pending') }
  scope :recent,       -> { order(created_at: :desc) }
end
