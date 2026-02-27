class AddObdToTrips < ActiveRecord::Migration[8.0]
  def change
    add_column :trips, :last_rpm,          :decimal, precision: 7, scale: 2
    add_column :trips, :last_coolant_temp,  :decimal, precision: 5, scale: 2
    add_column :trips, :last_fuel_level,    :decimal, precision: 5, scale: 2
    add_column :trips, :last_throttle,      :decimal, precision: 5, scale: 2
    add_column :trips, :obd_updated_at,     :datetime
  end
end
