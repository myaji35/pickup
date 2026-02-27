class Guardian < ApplicationRecord
  belongs_to :user
  belongs_to :passenger

  has_many :notification_settings, class_name: 'GuardianNotificationSetting', dependent: :destroy

  validates :relationship, inclusion: { in: %w[parent guardian other] }
  validates :user_id, uniqueness: { scope: :passenger_id }
end
