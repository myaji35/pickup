class Epic15PredictiveMaintenance < ActiveRecord::Migration[8.0]
  def change
    # ─────────────────────────────────────────
    # DTC 코드 참조 테이블
    # ─────────────────────────────────────────
    create_table :dtc_codes do |t|
      t.string :code, null: false          # P0300
      t.string :category, null: false      # engine / transmission / brake / emission / other
      t.string :severity, null: false      # low / medium / high / critical
      t.string :description, null: false   # 한국어 설명
      t.string :possible_causes            # 가능한 원인 (comma-separated)
      t.string :recommended_action         # 권장 조치
      t.timestamps
    end
    add_index :dtc_codes, :code, unique: true
    add_index :dtc_codes, :category
    add_index :dtc_codes, :severity

    # ─────────────────────────────────────────
    # 정비 예측 테이블
    # ─────────────────────────────────────────
    create_table :maintenance_predictions do |t|
      t.references :vehicle, null: false, foreign_key: true
      t.string  :component, null: false      # brake_pads / engine_oil / tires / air_filter / battery
      t.string  :status, null: false, default: 'ok'  # ok / warning / overdue
      t.integer :remaining_km               # 잔여 예측 주행 거리 (km)
      t.integer :remaining_days             # 잔여 예측 일수
      t.date    :predicted_due_date         # 예측 교체일
      t.integer :confidence_pct             # 예측 신뢰도 (0~100)
      t.text    :basis                      # 예측 근거 메모
      t.datetime :last_predicted_at, null: false
      t.datetime :d30_notified_at           # D-30 알림 발송 시각
      t.datetime :d7_notified_at            # D-7 알림 발송 시각
      t.timestamps
    end
    add_index :maintenance_predictions, [ :vehicle_id, :component ], unique: true
    add_index :maintenance_predictions, :status
    add_index :maintenance_predictions, :predicted_due_date

    # ─────────────────────────────────────────
    # 실제 정비 기록 테이블
    # ─────────────────────────────────────────
    create_table :maintenance_records do |t|
      t.references :vehicle, null: false, foreign_key: true
      t.references :maintenance_prediction, foreign_key: true  # nullable — 예측 없이도 등록 가능
      t.string  :component, null: false
      t.string  :record_type, null: false, default: 'repair'  # repair / inspection / replacement
      t.date    :performed_on, null: false
      t.integer :mileage_km                 # 정비 시점 주행거리
      t.decimal :cost, precision: 10, scale: 2
      t.string  :garage_name
      t.text    :notes
      t.string  :created_by_role            # institution_admin / driver / system
      t.timestamps
    end
    add_index :maintenance_records, :component
    add_index :maintenance_records, :performed_on

    # ─────────────────────────────────────────
    # 차량에 현재 주행거리 컬럼 추가
    # ─────────────────────────────────────────
    add_column :vehicles, :current_mileage_km, :integer, default: 0
    add_column :vehicles, :last_mileage_updated_at, :datetime
  end
end
