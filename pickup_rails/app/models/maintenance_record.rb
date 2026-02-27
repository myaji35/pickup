class MaintenanceRecord < ApplicationRecord
  RECORD_TYPES = %w[repair inspection replacement].freeze

  belongs_to :vehicle
  belongs_to :maintenance_prediction, optional: true

  validates :component, presence: true
  validates :record_type, inclusion: { in: RECORD_TYPES }
  validates :performed_on, presence: true
  validates :mileage_km, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :cost, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true

  scope :for_vehicle, ->(v) { where(vehicle: v).order(performed_on: :desc) }
  scope :recent, -> { order(performed_on: :desc) }

  after_create :update_vehicle_mileage

  private

  def update_vehicle_mileage
    return unless mileage_km.present?
    if vehicle.current_mileage_km.nil? || mileage_km > vehicle.current_mileage_km
      vehicle.update_columns(
        current_mileage_km: mileage_km,
        last_mileage_updated_at: Time.current
      )
    end
  end
end
