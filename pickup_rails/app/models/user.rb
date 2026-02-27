class User < ApplicationRecord
  has_secure_password

  enum :role, {
    super_admin: 0,
    institution_admin: 1,
    driver: 2,
    passenger: 3
  }

  belongs_to :institution, optional: true

  has_many :approved_institutions, class_name: "Institution", foreign_key: :approved_by_id
  has_many :trips, foreign_key: :driver_id

  validates :email, presence: true, uniqueness: { case_sensitive: false }, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :name, presence: true
  validates :role, presence: true
  validates :institution, presence: true, unless: :super_admin?

  before_save { self.email = email.downcase }

  scope :active, -> { where(is_active: true) }

  def admin?
    super_admin? || institution_admin?
  end
end
