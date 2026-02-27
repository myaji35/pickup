class MaintenancePrediction < ApplicationRecord
  COMPONENTS = %w[brake_pads engine_oil tires air_filter battery].freeze
  STATUSES   = %w[ok warning overdue].freeze

  belongs_to :vehicle
  has_many :maintenance_records, dependent: :nullify

  validates :component, inclusion: { in: COMPONENTS }
  validates :status,    inclusion: { in: STATUSES }
  validates :vehicle_id, uniqueness: { scope: :component }
  validates :confidence_pct, numericality: { in: 0..100 }, allow_nil: true

  scope :needs_attention, -> { where(status: %w[warning overdue]) }
  scope :for_vehicle, ->(v) { where(vehicle: v) }

  def warning?  = status == 'warning'
  def overdue?  = status == 'overdue'

  # D-30 / D-7 알림 발송 여부
  def needs_d30_notification?
    return false if d30_notified_at.present?
    return false if predicted_due_date.nil?
    days_remaining = (predicted_due_date - Date.today).to_i
    days_remaining <= 30 && days_remaining > 7
  end

  def needs_d7_notification?
    return false if d7_notified_at.present?
    return false if predicted_due_date.nil?
    days_remaining = (predicted_due_date - Date.today).to_i
    days_remaining <= 7
  end
end
