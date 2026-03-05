class AddDepartureFieldsToRosters < ActiveRecord::Migration[8.1]
  def change
    add_column :rosters, :departure_address, :string
    add_column :rosters, :departure_time, :string
  end
end
