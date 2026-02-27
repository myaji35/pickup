class Epic12Billing < ActiveRecord::Migration[8.1]
  def change
    # NOTE: 이 마이그레이션은 이전 세션에서 이미 적용 완료.
    # schema.rb 기준으로 subscriptions 확장 컬럼 및
    # payment_records / invoices 테이블이 존재함.
    # 재실행 시 충돌 방지를 위해 idempotent guard 적용.

    unless column_exists?(:subscriptions, :toss_billing_key)
      add_column :subscriptions, :toss_billing_key,     :string
      add_index  :subscriptions, :toss_billing_key, unique: true, where: "toss_billing_key IS NOT NULL"
    end
    unless column_exists?(:subscriptions, :next_billing_date)
      add_column :subscriptions, :next_billing_date,    :date
      add_index  :subscriptions, :next_billing_date
    end
    unless column_exists?(:subscriptions, :failed_payment_count)
      add_column :subscriptions, :failed_payment_count, :integer, default: 0, null: false
    end
    unless column_exists?(:subscriptions, :trial_ends_at)
      add_column :subscriptions, :trial_ends_at, :datetime
    end

    unless table_exists?(:payment_records)
      create_table :payment_records do |t|
        t.references :subscription, null: false, foreign_key: true
        t.references :institution,  null: false, foreign_key: true
        t.string   :toss_payment_key
        t.string   :toss_order_id,   null: false
        t.integer  :amount_krw,      null: false
        t.string   :status,          null: false, default: "pending"
        t.string   :failure_reason
        t.string   :card_company
        t.string   :card_number_masked
        t.datetime :paid_at
        t.timestamps
        t.index :toss_payment_key, unique: true, where: "toss_payment_key IS NOT NULL"
        t.index :toss_order_id,   unique: true
        t.index :status
        t.index :paid_at
      end
    end

    unless table_exists?(:invoices)
      create_table :invoices do |t|
        t.references :payment_record, null: false, foreign_key: true
        t.references :institution,    null: false, foreign_key: true
        t.string  :invoice_number,    null: false
        t.integer :amount_krw,        null: false
        t.date    :issue_date,        null: false
        t.string  :pdf_url
        t.timestamps
        t.index :invoice_number, unique: true
        t.index :issue_date
      end
    end
  end
end
