class Trip < ApplicationRecord
  enum :shuttle_type, { morning: 0, evening: 1, temporary: 2 }
  enum :status, { scheduled: 0, in_progress: 1, completed: 2, cancelled: 3 }

  belongs_to :roster
  belongs_to :driver, class_name: "User", foreign_key: :driver_id
  belongs_to :vehicle
  has_many :check_ins, dependent: :destroy

  validates :trip_date, presence: true
  validates :shuttle_type, presence: true

  def start!
    update!(status: :in_progress, started_at: Time.current)
  end

  def end!
    update!(status: :completed, ended_at: Time.current)
  end
end
