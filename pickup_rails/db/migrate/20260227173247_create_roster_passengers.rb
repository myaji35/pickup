class CreateRosterPassengers < ActiveRecord::Migration[8.1]
  def change
    create_table :roster_passengers do |t|
      t.references :roster, null: false, foreign_key: true
      t.references :passenger, null: false, foreign_key: true

      t.timestamps
    end
  end
end
