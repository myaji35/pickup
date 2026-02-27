class CheckIn < ApplicationRecord
  enum :status, { pending: 0, boarded: 1, alighted: 2, absent: 3 }

  belongs_to :trip
  belongs_to :passenger

  def board!
    update!(status: :boarded, boarded_at: Time.current)
  end

  def alight!
    update!(status: :alighted, alighted_at: Time.current)
  end
end
