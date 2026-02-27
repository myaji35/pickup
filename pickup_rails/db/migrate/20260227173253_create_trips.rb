class CreateTrips < ActiveRecord::Migration[8.1]
  def change
    create_table :trips do |t|
      t.references :roster, null: false, foreign_key: true
      t.references :driver, null: false, foreign_key: { to_table: :users }
      t.references :vehicle, null: false, foreign_key: true
      t.date :trip_date
      t.integer :shuttle_type
      t.integer :status
      t.datetime :started_at
      t.datetime :ended_at

      t.timestamps
    end
  end
end
