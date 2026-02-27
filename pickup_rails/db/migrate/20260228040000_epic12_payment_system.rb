class Epic12PaymentSystem < ActiveRecord::Migration[8.1]
  def change
    # ── subscriptions 테이블 확장 ──────────────────────────────────────────
    # trial_ends_at, end_date, status 는 기존 마이그레이션에 이미 존재
    add_column :subscriptions, :toss_billing_key,      :string
    add_column :subscriptions, :next_billing_date,     :date
    add_column :subscriptions, :failed_payment_count,  :integer, default: 0, null: false
    add_column :subscriptions, :notes,                 :text

    add_index :subscriptions, :next_billing_date
    add_index :subscriptions, :toss_billing_key, unique: true, where: "toss_billing_key IS NOT NULL"

    # ── payment_records 테이블 ────────────────────────────────────────────
    create_table :payment_records do |t|
      t.references :subscription, null: false, foreign_key: true
      t.references :institution,  null: false, foreign_key: true
      t.string     :toss_payment_key
      t.string     :toss_order_id,  null: false
      t.integer    :amount_krw,     null: false
      t.string     :status,         null: false, default: 'pending'
                                    # pending / success / failed / refunded
      t.string     :failure_reason
      t.string     :card_company
      t.string     :card_number_masked
      t.datetime   :paid_at
      t.timestamps
    end
    add_index :payment_records, :toss_payment_key, unique: true,
              where: "toss_payment_key IS NOT NULL"
    add_index :payment_records, :toss_order_id, unique: true
    add_index :payment_records, :status
    add_index :payment_records, :paid_at

    # ── invoices 테이블 ───────────────────────────────────────────────────
    create_table :invoices do |t|
      t.references :payment_record, null: false, foreign_key: true
      t.references :institution,    null: false, foreign_key: true
      t.string     :invoice_number, null: false
      t.integer    :amount_krw,     null: false
      t.integer    :tax_amount_krw, null: false, default: 0
      t.date       :issue_date,     null: false
      t.date       :due_date
      t.string     :status,         default: 'issued'  # issued / sent / overdue
      t.string     :pdf_url
      t.timestamps
    end
    add_index :invoices, :invoice_number, unique: true
    add_index :invoices, :issue_date
  end
end
