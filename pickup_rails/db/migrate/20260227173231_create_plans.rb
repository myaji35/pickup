class CreatePlans < ActiveRecord::Migration[8.1]
  def change
    create_table :plans do |t|
      t.string :name
      t.string :code
      t.integer :max_vehicles
      t.integer :max_passengers
      t.integer :monthly_price
      t.text :features
      t.boolean :is_active

      t.timestamps
    end
    add_index :plans, :code, unique: true
  end
end
