class CreateSubscriptions < ActiveRecord::Migration[8.1]
  def change
    create_table :subscriptions do |t|
      t.references :institution, null: false, foreign_key: true
      t.references :plan, null: false, foreign_key: true
      t.integer :status
      t.datetime :start_date
      t.datetime :end_date
      t.datetime :trial_ends_at
      t.boolean :auto_renew

      t.timestamps
    end
  end
end
