class ExpenseReceipt < ApplicationRecord
  RECEIPT_TYPES = %w[fuel maintenance toll other].freeze
  OCR_STATUSES  = %w[pending processing done failed].freeze

  RECEIPT_TYPE_LABELS = {
    'fuel'        => '연료비',
    'maintenance' => '정비비',
    'toll'        => '통행료',
    'other'       => '기타',
  }.freeze

  belongs_to :vehicle
  belongs_to :driver, class_name: 'User'
  belongs_to :trip, optional: true

  validates :receipt_type, inclusion: { in: RECEIPT_TYPES }
  validates :ocr_status,   inclusion: { in: OCR_STATUSES }

  scope :by_vehicle, ->(v)    { where(vehicle: v).order(receipt_date: :desc) }
  scope :confirmed,           -> { where(confirmed: true) }
  scope :pending_ocr,         -> { where(ocr_status: 'pending') }

  # OCR 결과 파싱 후 필드에 반영
  def apply_ocr_result!(raw_json)
    parsed = JSON.parse(raw_json) rescue {}
    self.amount_krw   = parsed['amount']&.to_i
    self.vendor_name  = parsed['vendor']
    self.receipt_date = parsed['date'].present? ? Date.parse(parsed['date']) : receipt_date
    self.ocr_raw      = raw_json
    self.ocr_status   = 'done'
    save!
  end

  def type_label
    RECEIPT_TYPE_LABELS[receipt_type] || receipt_type
  end
end
