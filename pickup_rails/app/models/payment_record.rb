class PaymentRecord < ApplicationRecord
  STATUSES = %w[pending success failed refunded].freeze

  belongs_to :subscription
  belongs_to :institution

  has_one :invoice, dependent: :destroy

  validates :toss_order_id, presence: true, uniqueness: true
  validates :amount_krw, presence: true, numericality: { greater_than: 0 }
  validates :status, inclusion: { in: STATUSES }

  scope :successful, -> { where(status: 'success') }
  scope :failed,     -> { where(status: 'failed') }
  scope :recent,     -> { order(created_at: :desc) }

  def success?  = status == 'success'
  def failed?   = status == 'failed'
  def refunded? = status == 'refunded'
end
