class Epic13Partnership < ActiveRecord::Migration[8.1]
  def change
    # ── 파트너 API 키 (보험사 인증용) ──────────────────────────────────────
    create_table :partner_api_keys do |t|
      t.string  :partner_name,  null: false           # "DB손해보험", "현대해상"
      t.string  :partner_type,  null: false           # insurance / garage_network
      t.string  :api_key_digest, null: false          # SHA256 해시 저장
      t.string  :allowed_scopes, null: false, default: "safety_report"
      t.boolean :active,        null: false, default: true
      t.datetime :last_used_at
      t.timestamps
      t.index :api_key_digest, unique: true
      t.index :partner_type
    end

    # ── 제휴 정비소 ────────────────────────────────────────────────────────
    create_table :partner_garages do |t|
      t.string  :name,          null: false
      t.string  :address,       null: false
      t.decimal :lat,           precision: 10, scale: 7
      t.decimal :lng,           precision: 10, scale: 7
      t.string  :phone
      t.string  :brand                                # "보쉬카서비스", "카카오모빌리티"
      t.string  :specialties,   default: "[]"         # JSON array: ["엔진","브레이크"]
      t.integer :rating_x10,   default: 0             # 4.5점 → 45
      t.boolean :active,        null: false, default: true
      t.timestamps
      t.index [:lat, :lng]
    end

    # ── 정비소 예약 ────────────────────────────────────────────────────────
    create_table :garage_reservations do |t|
      t.references :partner_garage, null: false, foreign_key: true
      t.references :institution,    null: false, foreign_key: true
      t.references :vehicle,        null: false, foreign_key: true
      t.references :dtc_report,     foreign_key: true  # 연결 DTC (optional)
      t.string  :status,    null: false, default: "pending"  # pending/confirmed/completed/cancelled
      t.date    :reserved_date, null: false
      t.string  :reserved_time                         # "10:00"
      t.text    :note
      t.integer :referral_fee_krw, default: 0          # 수수료 (원)
      t.datetime :confirmed_at
      t.timestamps
      t.index :status
      t.index :reserved_date
    end

    # ── 레퍼럴 수수료 트래킹 ─────────────────────────────────────────────
    create_table :referral_rewards do |t|
      t.references :garage_reservation, null: false, foreign_key: true
      t.integer :amount_krw,   null: false, default: 5000   # 건당 5,000원
      t.string  :status,       null: false, default: "pending"  # pending/paid
      t.datetime :paid_at
      t.timestamps
    end
  end
end
