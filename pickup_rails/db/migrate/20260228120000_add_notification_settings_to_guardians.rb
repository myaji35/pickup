class AddNotificationSettingsToGuardians < ActiveRecord::Migration[8.0]
  def change
    create_table :guardian_notification_settings do |t|
      t.references :guardian, null: false, foreign_key: true
      t.string :notif_type, null: false
      t.boolean :enabled, default: true, null: false
      t.text :template

      t.timestamps
    end

    add_index :guardian_notification_settings, [:guardian_id, :notif_type], unique: true,
              name: 'idx_guardian_notif_settings_unique'
  end
end
