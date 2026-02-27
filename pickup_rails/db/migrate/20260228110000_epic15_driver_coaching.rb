class Epic15DriverCoaching < ActiveRecord::Migration[8.0]
  def change
    # ─────────────────────────────────────────
    # 코칭 메시지 테이블 (실시간 피드백)
    # ─────────────────────────────────────────
    create_table :coaching_messages do |t|
      t.references :driver, null: false, foreign_key: { to_table: :users }
      t.references :trip, foreign_key: true         # nullable — 운행 외 발송 가능
      t.string :trigger_event, null: false           # harsh_braking / speeding / dtc_alert / weekly_summary
      t.string :message_type, null: false, default: 'tip'  # tip / warning / praise / summary
      t.text   :content, null: false
      t.string :severity, default: 'info'            # info / warning / critical
      t.boolean :read, default: false
      t.timestamps
    end
    add_index :coaching_messages, [ :driver_id, :read ]

    # ─────────────────────────────────────────
    # 드라이버 배지 테이블 (게이미피케이션)
    # ─────────────────────────────────────────
    create_table :driver_badges do |t|
      t.references :driver, null: false, foreign_key: { to_table: :users }
      t.string :badge_type, null: false    # safe_driver / smooth_braker / punctual / ...
      t.string :level, null: false         # bronze / silver / gold / platinum
      t.date   :earned_on, null: false
      t.text   :criteria_snapshot         # 수상 당시 근거 JSON
      t.timestamps
    end
    add_index :driver_badges, [ :driver_id, :badge_type ]

    # ─────────────────────────────────────────
    # 드라이버 주간 코칭 요약 테이블
    # ─────────────────────────────────────────
    create_table :weekly_coaching_summaries do |t|
      t.references :driver, null: false, foreign_key: { to_table: :users }
      t.date    :week_start, null: false
      t.integer :total_trips, default: 0
      t.integer :total_events, default: 0
      t.decimal :avg_score, precision: 5, scale: 2
      t.integer :badges_earned, default: 0
      t.text    :improvement_tips         # JSON array
      t.text    :praise_points            # JSON array
      t.timestamps
    end
    add_index :weekly_coaching_summaries, [ :driver_id, :week_start ], unique: true
  end
end
