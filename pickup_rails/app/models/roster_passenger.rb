class RosterPassenger < ApplicationRecord
  belongs_to :roster
  belongs_to :passenger
end
