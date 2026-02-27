class CreateInstitutions < ActiveRecord::Migration[8.1]
  def change
    create_table :institutions do |t|
      t.string :name
      t.string :business_number
      t.string :address
      t.string :phone
      t.integer :status
      t.string :rejection_reason
      t.datetime :approved_at
      t.bigint :approved_by_id, null: true   # SUPER_ADMIN user id
      t.datetime :suspended_at
      t.string :suspension_reason
      t.references :institution_type, null: true, foreign_key: true

      t.timestamps
    end
    add_index :institutions, :business_number, unique: true
  end
end
