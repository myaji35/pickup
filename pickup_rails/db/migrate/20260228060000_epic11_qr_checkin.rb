class Epic11QrCheckin < ActiveRecord::Migration[8.1]
  def change
    # check_ins: 체크인 방식 기록 (manual / qr / nfc)
    add_column :check_ins, :source, :string, default: "manual"
    add_index  :check_ins, :source
  end
end
