class Epic9VrpColumns < ActiveRecord::Migration[8.1]
  def change
    # roster_passengers: 픽업 순서 + 최적화 결과 저장
    add_column :roster_passengers, :boarding_order,         :integer
    add_column :roster_passengers, :estimated_arrival_sec,  :integer  # 차량 출발 기준 도착 예상 시간(초)
    add_column :roster_passengers, :cumulative_distance_m,  :integer  # 누적 이동 거리(m)

    add_index :roster_passengers, :boarding_order

    # rosters: 마지막 최적화 결과 메타데이터
    add_column :rosters, :last_optimized_at,     :datetime
    add_column :rosters, :optimized_distance_m,  :integer   # 최적화 후 총 거리(m)
    add_column :rosters, :optimized_duration_sec,:integer   # 최적화 후 총 시간(초)
    add_column :rosters, :original_distance_m,   :integer   # 최적화 전 총 거리(m, 비교용)
    add_column :rosters, :distance_source,       :string    # "kakao" or "haversine"
  end
end
