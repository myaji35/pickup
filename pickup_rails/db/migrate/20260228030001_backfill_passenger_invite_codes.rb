class BackfillPassengerInviteCodes < ActiveRecord::Migration[8.1]
  def up
    Passenger.where(invite_code: nil).find_each do |p|
      code = loop do
        c = SecureRandom.alphanumeric(8).upcase
        break c unless Passenger.exists?(invite_code: c)
      end
      p.update_columns(invite_code: code)
    end
  end

  def down
    # irreversible
  end
end
