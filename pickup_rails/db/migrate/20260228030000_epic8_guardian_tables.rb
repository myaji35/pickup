class Epic8GuardianTables < ActiveRecord::Migration[8.1]
  def change
    # 승객 초대 코드 추가
    add_column :passengers, :invite_code, :string
    add_index  :passengers, :invite_code, unique: true

    # 보호자 테이블
    create_table :guardians do |t|
      t.references :user,      null: false, foreign_key: true
      t.references :passenger, null: false, foreign_key: true
      t.string     :relationship, default: 'parent'   # parent / guardian / other
      t.timestamps
      t.index [:user_id, :passenger_id], unique: true, name: 'index_guardians_on_user_passenger'
    end

    # 당일 취소 테이블
    create_table :trip_cancellations do |t|
      t.references :roster_passenger, null: false, foreign_key: true
      t.references :requested_by,     null: false, foreign_key: { to_table: :users }
      t.string  :reason
      t.date    :cancel_date, null: false
      t.timestamps
    end

    # FCM 토큰 (users 테이블에 추가)
    add_column :users, :fcm_token, :string
  end
end
