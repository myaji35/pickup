class Invoice < ApplicationRecord
  STATUSES = %w[issued sent overdue].freeze

  belongs_to :payment_record
  belongs_to :institution

  validates :invoice_number, presence: true, uniqueness: true
  validates :amount_krw,     presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :issue_date,     presence: true
  validates :status,         inclusion: { in: STATUSES }

  before_validation :set_invoice_number, on: :create

  scope :recent, -> { order(issue_date: :desc) }

  def total_with_tax
    amount_krw + tax_amount_krw
  end

  private

  def set_invoice_number
    return if invoice_number.present?

    year_month = Date.today.strftime('%Y%m')
    last_seq = Invoice.where("invoice_number LIKE ?", "INV-#{year_month}-%")
                      .maximum("CAST(SUBSTR(invoice_number, 12) AS INTEGER)").to_i
    self.invoice_number = "INV-#{year_month}-#{format('%04d', last_seq + 1)}"
  end
end
