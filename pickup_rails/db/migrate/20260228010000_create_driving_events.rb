class CreateDrivingEvents < ActiveRecord::Migration[8.0]
  def change
    create_table :driving_events do |t|
      t.references :trip,   null: false, foreign_key: true
      t.references :driver, null: false, foreign_key: { to_table: :users }
      t.string  :event_type,   null: false   # harsh_accel / harsh_brake / speeding / idling
      t.decimal :speed,        precision: 6, scale: 2
      t.decimal :rpm,          precision: 7, scale: 2
      t.decimal :lat,          precision: 10, scale: 7
      t.decimal :lng,          precision: 10, scale: 7
      t.timestamps
    end

    add_index :driving_events, :event_type
    add_index :driving_events, :created_at
  end
end
