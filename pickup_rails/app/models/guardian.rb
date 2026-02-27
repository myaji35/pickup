class Guardian < ApplicationRecord
  belongs_to :user
  belongs_to :passenger

  validates :relationship, inclusion: { in: %w[parent guardian other] }
  validates :user_id, uniqueness: { scope: :passenger_id }
end
