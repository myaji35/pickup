class CreatePassengerSchedules < ActiveRecord::Migration[8.1]
  def change
    create_table :passenger_schedules do |t|
      t.references :passenger, null: false, foreign_key: true
      t.integer :day_of_week
      t.string :pickup_time
      t.string :dropoff_time
      t.integer :shuttle_type
      t.boolean :is_active

      t.timestamps
    end
  end
end
