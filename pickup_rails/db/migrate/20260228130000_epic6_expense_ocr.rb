class Epic6ExpenseOcr < ActiveRecord::Migration[8.0]
  def change
    # 영수증/경비 테이블
    create_table :expense_receipts do |t|
      t.references :vehicle,     null: false, foreign_key: true
      t.references :driver,      null: false, foreign_key: { to_table: :users }
      t.references :trip,        null: true,  foreign_key: true

      t.string  :receipt_type,   null: false  # fuel | maintenance | toll | other
      t.string  :image_url                    # 업로드된 이미지 URL
      t.integer :amount_krw                   # OCR 추출 금액
      t.string  :vendor_name                  # 가맹점명
      t.date    :receipt_date                 # 영수증 날짜
      t.string  :ocr_status,     default: 'pending'  # pending | processing | done | failed
      t.text    :ocr_raw                      # OCR 원본 JSON
      t.boolean :confirmed,      default: false       # 관리자 확인 여부

      t.timestamps
    end

    add_index :expense_receipts, :ocr_status
    add_index :expense_receipts, :receipt_date

    # 월별 운행 정산 요약 테이블
    create_table :monthly_settlements do |t|
      t.references :institution, null: false, foreign_key: true
      t.references :vehicle,     null: false, foreign_key: true

      t.integer :year,           null: false
      t.integer :month,          null: false
      t.integer :total_trips,    default: 0
      t.integer :total_distance_km, default: 0
      t.integer :fuel_cost_krw,  default: 0
      t.integer :maintenance_cost_krw, default: 0
      t.integer :toll_cost_krw,  default: 0
      t.integer :total_cost_krw, default: 0
      t.string  :status,         default: 'draft'   # draft | confirmed | invoiced

      t.timestamps
    end

    add_index :monthly_settlements, [:vehicle_id, :year, :month], unique: true,
              name: 'idx_monthly_settlements_vehicle_period'
    add_index :monthly_settlements, [:institution_id, :year, :month],
              name: 'idx_monthly_settlements_institution_period'
  end
end
