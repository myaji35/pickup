class WeeklyCoachingSummary < ApplicationRecord
  belongs_to :driver, class_name: 'User'

  validates :week_start, presence: true
  validates :driver_id, uniqueness: { scope: :week_start }

  def improvement_tips_array
    JSON.parse(improvement_tips || '[]')
  rescue JSON::ParserError
    []
  end

  def praise_points_array
    JSON.parse(praise_points || '[]')
  rescue JSON::ParserError
    []
  end
end
