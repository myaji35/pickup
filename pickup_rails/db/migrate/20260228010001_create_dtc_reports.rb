class CreateDtcReports < ActiveRecord::Migration[8.0]
  def change
    create_table :dtc_reports do |t|
      t.references :trip,    null: false, foreign_key: true
      t.references :vehicle, null: false, foreign_key: true
      t.string  :code,       null: false   # e.g. "P0133"
      t.string  :status,     default: 'pending'  # pending / acknowledged / resolved
      t.timestamps
    end

    add_index :dtc_reports, :code
    add_index :dtc_reports, :status
  end
end
