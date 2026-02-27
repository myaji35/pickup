class CreateInstitutionTypes < ActiveRecord::Migration[8.1]
  def change
    create_table :institution_types do |t|
      t.string :type_code
      t.string :type_name
      t.integer :minimum_care_time_hours

      t.timestamps
    end
    add_index :institution_types, :type_code, unique: true
  end
end
