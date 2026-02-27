class CreatePassengers < ActiveRecord::Migration[8.1]
  def change
    create_table :passengers do |t|
      t.references :institution, null: false, foreign_key: true
      t.string :name
      t.string :phone
      t.string :pickup_address
      t.float :pickup_lat
      t.float :pickup_lng
      t.string :dropoff_address
      t.float :dropoff_lat
      t.float :dropoff_lng
      t.string :guardian_phone
      t.boolean :is_active

      t.timestamps
    end
  end
end
