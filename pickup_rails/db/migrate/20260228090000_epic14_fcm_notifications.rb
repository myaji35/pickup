class Epic14FcmNotifications < ActiveRecord::Migration[8.0]
  def change
    # FCM 디바이스 토큰
    unless table_exists?(:fcm_tokens)
      create_table :fcm_tokens do |t|
        t.references :user, null: false, foreign_key: true
        t.string :token,       null: false
        t.string :device_type, null: false, default: 'unknown' # ios / android / web
        t.datetime :last_used_at
        t.timestamps
      end
      add_index :fcm_tokens, :token, unique: true
      add_index :fcm_tokens, [:user_id, :device_type]
    end

    # 알림 발송 이력
    unless table_exists?(:notification_logs)
      create_table :notification_logs do |t|
        t.references :user,        null: true, foreign_key: true
        t.references :institution, null: true, foreign_key: true
        t.string  :notification_type, null: false  # trip_started / boarded / alighted / eta_approaching
        t.string  :title,             null: false
        t.string  :body,              null: false
        t.text    :data,              default: '{}'
        t.string  :status,            null: false, default: 'sent'  # sent / failed
        t.string  :fcm_message_id
        t.timestamps
      end
      add_index :notification_logs, :notification_type
      add_index :notification_logs, :created_at
    end
  end
end
