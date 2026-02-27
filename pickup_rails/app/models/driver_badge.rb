class DriverBadge < ApplicationRecord
  BADGE_TYPES = %w[
    safe_driver
    smooth_braker
    no_speeding
    punctual
    mileage_100k
    veteran
    perfect_week
    eco_driver
  ].freeze

  LEVELS = %w[bronze silver gold platinum].freeze

  BADGE_LABELS = {
    'safe_driver'   => '안전 드라이버',
    'smooth_braker' => '부드러운 제동',
    'no_speeding'   => '과속 없음',
    'punctual'      => '정시 운행',
    'mileage_100k'  => '10만km 달성',
    'veteran'       => '베테랑 드라이버',
    'perfect_week'  => '완벽한 한 주',
    'eco_driver'    => '에코 드라이버'
  }.freeze

  LEVEL_COLORS = {
    'bronze'   => '#cd7f32',
    'silver'   => '#c0c0c0',
    'gold'     => '#ffd700',
    'platinum' => '#e5e4e2'
  }.freeze

  belongs_to :driver, class_name: 'User'

  validates :badge_type, inclusion: { in: BADGE_TYPES }
  validates :level,      inclusion: { in: LEVELS }
  validates :earned_on,  presence: true

  scope :for_driver, ->(d) { where(driver: d).order(earned_on: :desc) }

  def label  = BADGE_LABELS[badge_type] || badge_type
  def color  = LEVEL_COLORS[level] || '#94a3b8'
end
