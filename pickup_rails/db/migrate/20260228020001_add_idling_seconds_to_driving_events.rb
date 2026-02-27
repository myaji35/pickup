class AddIdlingSecondsToDrivingEvents < ActiveRecord::Migration[8.0]
  def change
    # 공회전 이벤트의 지속 시간 (초) 추가
    add_column :driving_events, :duration_seconds, :integer, default: 0
  end
end
