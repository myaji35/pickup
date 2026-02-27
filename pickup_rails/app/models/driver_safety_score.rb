class DriverSafetyScore < ApplicationRecord
  belongs_to :driver,      class_name: 'User'
  belongs_to :institution

  validates :period_year, :period_week, presence: true
  validates :total_score, numericality: { in: 0..100 }

  scope :current_week, -> {
    now = Time.current
    where(period_year: now.year, period_week: now.strftime('%V').to_i)
  }

  scope :for_institution, ->(id) { where(institution_id: id) }

  # 기관 내 순위 재산출 (주차별)
  def self.recalculate_ranks!(institution_id, year, week)
    scores = where(institution_id: institution_id, period_year: year, period_week: week)
              .order(total_score: :desc)
    scores.each_with_index do |s, i|
      s.update_columns(rank_in_institution: i + 1)
    end
  end
end
