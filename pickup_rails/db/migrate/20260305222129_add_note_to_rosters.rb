class AddNoteToRosters < ActiveRecord::Migration[8.1]
  def change
    add_column :rosters, :note, :text
  end
end
