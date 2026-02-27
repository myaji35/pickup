class CreateUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      t.string :email
      t.string :password_digest
      t.string :name
      t.integer :role
      t.boolean :is_active
      t.references :institution, null: true, foreign_key: true  # null: SUPER_ADMIN은 기관 없음

      t.timestamps
    end
    add_index :users, :email, unique: true
  end
end
