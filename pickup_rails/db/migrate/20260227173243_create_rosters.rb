class CreateRosters < ActiveRecord::Migration[8.1]
  def change
    create_table :rosters do |t|
      t.references :institution, null: false, foreign_key: true
      t.references :vehicle, null: false, foreign_key: true
      t.date :week_start_date
      t.integer :shuttle_type

      t.timestamps
    end
  end
end
