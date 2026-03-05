class Institution < ApplicationRecord
  enum :status, {
    pending: 0,
    active: 1,
    suspended: 2,
    inactive: 3
  }

  belongs_to :institution_type, optional: true
  belongs_to :approved_by, class_name: "User", foreign_key: :approved_by_id, optional: true

  has_many :users, dependent: :destroy
  has_many :vehicles, dependent: :destroy
  has_many :passengers, dependent: :destroy
  has_many :rosters, dependent: :destroy
  has_many :trips, through: :rosters
  has_many :subscriptions, dependent: :destroy
  has_many :payment_records, dependent: :destroy
  has_many :invoices, dependent: :destroy

  validates :name, presence: true
  validates :business_number, presence: true, uniqueness: true, format: { with: /\A\d{3}-\d{2}-\d{5}\z/, message: "형식: 000-00-00000" }
  validates :status, presence: true

  scope :pending_approval, -> { where(status: :pending).order(created_at: :asc) }

  def approve!(admin_user)
    update!(status: :active, approved_by: admin_user, approved_at: Time.current)
  end

  def reject!(reason)
    update!(status: :inactive, rejection_reason: reason)
  end

  def suspend!(reason)
    update!(status: :suspended, suspension_reason: reason, suspended_at: Time.current)
  end

  def reactivate!
    update!(status: :active, suspension_reason: nil, suspended_at: nil)
  end
end
