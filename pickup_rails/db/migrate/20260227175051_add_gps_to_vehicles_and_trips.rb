class AddGpsToVehiclesAndTrips < ActiveRecord::Migration[8.1]
  def change
    # 차량 현재 위치
    add_column :vehicles, :current_lat, :decimal, precision: 10, scale: 7
    add_column :vehicles, :current_lng, :decimal, precision: 10, scale: 7
    add_column :vehicles, :heading, :decimal, precision: 5, scale: 2  # 방향각 0~360
    add_column :vehicles, :speed, :decimal, precision: 5, scale: 2    # km/h
    add_column :vehicles, :location_updated_at, :datetime

    # 운행 중 실시간 위치 (Trip 기준)
    add_column :trips, :current_lat, :decimal, precision: 10, scale: 7
    add_column :trips, :current_lng, :decimal, precision: 10, scale: 7
    add_column :trips, :location_updated_at, :datetime
  end
end
