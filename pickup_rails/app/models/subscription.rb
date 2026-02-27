class Subscription < ApplicationRecord
  enum :status, { trial: 0, active: 1, expired: 2, cancelled: 3, suspended: 4 }

  belongs_to :institution
  belongs_to :plan
  has_many :payment_records, dependent: :destroy

  validates :start_date, presence: true

  scope :active_for, ->(institution) {
    where(institution: institution, status: [:trial, :active])
    .order(created_at: :desc)
    .first
  }

  # 이번 달 갱신 대상 (다음 청구일이 오늘 이전인 활성/체험 구독)
  scope :due_for_renewal, -> {
    where(status: [:trial, :active])
    .where("next_billing_date <= ?", Date.today)
    .where.not(toss_billing_key: nil)
  }

  def in_trial?
    trial? && trial_ends_at&.future?
  end

  def trial_expired?
    trial? && trial_ends_at&.past?
  end

  def days_until_next_billing
    return nil if next_billing_date.nil?
    (next_billing_date - Date.today).to_i
  end
end
