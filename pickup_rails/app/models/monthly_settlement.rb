class MonthlySettlement < ApplicationRecord
  belongs_to :institution
  belongs_to :vehicle

  validates :year,  presence: true, numericality: { only_integer: true }
  validates :month, presence: true, numericality: { only_integer: true, in: 1..12 }
  validates :vehicle_id, uniqueness: { scope: [:year, :month] }

  scope :for_institution, ->(inst) { where(institution: inst).order(year: :desc, month: :desc) }

  # 특정 월의 정산 집계 계산 (없으면 생성, 있으면 갱신)
  def self.calculate!(institution:, vehicle:, year:, month:)
    settlement = find_or_initialize_by(institution: institution, vehicle: vehicle,
                                       year: year, month: month)

    period_start = Date.new(year, month, 1)
    period_end   = period_start.end_of_month

    # 완료된 운행 집계
    trips = vehicle.trips
                   .where(status: :completed)
                   .where(trip_date: period_start..period_end)

    total_trips    = trips.count
    total_distance = trips.sum { |t| t.respond_to?(:distance_km) ? (t.distance_km || 0) : 0 }

    # 확정된 영수증 집계
    receipts = ExpenseReceipt.where(vehicle: vehicle, confirmed: true)
                             .where(receipt_date: period_start..period_end)

    fuel_cost        = receipts.where(receipt_type: 'fuel').sum(:amount_krw).to_i
    maintenance_cost = receipts.where(receipt_type: 'maintenance').sum(:amount_krw).to_i
    toll_cost        = receipts.where(receipt_type: 'toll').sum(:amount_krw).to_i

    settlement.assign_attributes(
      total_trips:          total_trips,
      total_distance_km:    total_distance.to_i,
      fuel_cost_krw:        fuel_cost,
      maintenance_cost_krw: maintenance_cost,
      toll_cost_krw:        toll_cost,
      total_cost_krw:       fuel_cost + maintenance_cost + toll_cost
    )
    settlement.save!
    settlement
  end

  def period_label
    "#{year}년 #{month}월"
  end
end
