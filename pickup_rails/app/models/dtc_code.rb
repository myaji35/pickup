class DtcCode < ApplicationRecord
  CATEGORIES = %w[engine transmission brake emission electrical body chassis other].freeze
  SEVERITIES = %w[low medium high critical].freeze

  validates :code, presence: true, uniqueness: true, format: { with: /\A[A-Z][0-9]{4}\z/ }
  validates :category, inclusion: { in: CATEGORIES }
  validates :severity, inclusion: { in: SEVERITIES }
  validates :description, presence: true

  scope :critical, -> { where(severity: %w[high critical]) }
  scope :by_category, ->(cat) { where(category: cat) }

  def critical?
    %w[high critical].include?(severity)
  end
end
