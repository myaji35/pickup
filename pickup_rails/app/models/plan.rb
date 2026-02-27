class Plan < ApplicationRecord
  has_many :subscriptions

  validates :name, :code, presence: true
  validates :code, uniqueness: true
  validates :monthly_price, numericality: { greater_than_or_equal_to: 0 }

  scope :active, -> { where(is_active: true) }

  def features_hash
    return {} if features.blank?
    JSON.parse(features)
  rescue JSON::ParserError
    {}
  end
end
