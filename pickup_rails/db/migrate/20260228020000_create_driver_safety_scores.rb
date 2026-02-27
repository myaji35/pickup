class CreateDriverSafetyScores < ActiveRecord::Migration[8.0]
  def change
    create_table :driver_safety_scores do |t|
      t.references :driver,      null: false, foreign_key: { to_table: :users }
      t.references :institution,  null: false, foreign_key: true
      t.integer :period_year,     null: false
      t.integer :period_week,     null: false   # ISO 주차 (1~53)
      t.decimal :total_score,     precision: 5, scale: 2, default: 100  # 100점 만점
      t.integer :harsh_accel_count, default: 0
      t.integer :harsh_brake_count, default: 0
      t.integer :speeding_count,    default: 0
      t.integer :idling_count,      default: 0
      t.integer :total_trips,       default: 0
      t.integer :total_distance_km, default: 0
      t.integer :rank_in_institution          # 기관 내 순위
      t.timestamps
    end

    add_index :driver_safety_scores, [:driver_id, :period_year, :period_week],
              unique: true, name: 'idx_safety_score_driver_period'
    add_index :driver_safety_scores, [:institution_id, :period_year, :period_week],
              name: 'idx_safety_score_institution_period'
  end
end
