class CreateCheckIns < ActiveRecord::Migration[8.1]
  def change
    create_table :check_ins do |t|
      t.references :trip, null: false, foreign_key: true
      t.references :passenger, null: false, foreign_key: true
      t.datetime :boarded_at
      t.datetime :alighted_at
      t.integer :status

      t.timestamps
    end
  end
end
