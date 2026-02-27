class CreateVehicles < ActiveRecord::Migration[8.1]
  def change
    create_table :vehicles do |t|
      t.references :institution, null: false, foreign_key: true
      t.string :plate_number
      t.string :plate_last4
      t.string :vehicle_type
      t.integer :capacity
      t.integer :status

      t.timestamps
    end
  end
end
