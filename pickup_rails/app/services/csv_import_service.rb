require "csv"

class CsvImportService
  REQUIRED_COLUMNS = %w[이름 픽업주소].freeze
  OPTIONAL_COLUMNS = %w[전화번호 하차주소 보호자전화번호].freeze

  attr_reader :institution, :file

  def initialize(institution, file)
    @institution = institution
    @file = file
  end

  def call
    results = { success: 0, failed: 0, errors: [] }
    table = parse_csv

    table.each_with_index do |row, idx|
      line = idx + 2  # 헤더 제외, 1-based

      unless valid_row?(row)
        results[:failed] += 1
        results[:errors] << { line: line, message: "필수 항목 누락 (이름, 픽업주소 필수)" }
        next
      end

      passenger = institution.passengers.build(
        name:             row["이름"]&.strip,
        phone:            row["전화번호"]&.strip,
        pickup_address:   row["픽업주소"]&.strip,
        dropoff_address:  row["하차주소"]&.strip,
        guardian_phone:   row["보호자전화번호"]&.strip,
        is_active:        true
      )

      if passenger.save
        results[:success] += 1
      else
        results[:failed] += 1
        results[:errors] << {
          line: line,
          name: row["이름"],
          message: passenger.errors.full_messages.join(", ")
        }
      end
    rescue => e
      results[:failed] += 1
      results[:errors] << { line: line, message: "처리 오류: #{e.message}" }
    end

    results
  end

  def self.template_csv
    CSV.generate(encoding: "UTF-8") do |csv|
      csv << %w[이름 전화번호 픽업주소 하차주소 보호자전화번호]
      csv << ["홍길동", "010-1234-5678", "서울시 강남구 테헤란로 1", "서울시 강남구 테헤란로 100", "010-9876-5432"]
      csv << ["김철수", "010-2345-6789", "서울시 서초구 반포대로 10", "", ""]
    end
  end

  private

  def parse_csv
    raw = if file.respond_to?(:read)
      file.rewind if file.respond_to?(:rewind)
      file.read
    else
      File.binread(file.to_s)
    end

    # 바이너리로 통일 후 BOM 제거 (Excel UTF-8 BOM: EF BB BF)
    raw_bytes = raw.dup.force_encoding("BINARY")
    raw_bytes.sub!(/\A\xEF\xBB\xBF/n, "")

    # UTF-8 시도 → 실패 시 EUC-KR로 변환
    content = raw_bytes.dup.force_encoding("UTF-8")
    unless content.valid_encoding?
      content = raw_bytes.dup.force_encoding("EUC-KR").encode("UTF-8", invalid: :replace, undef: :replace)
    end

    # 반드시 UTF-8 인코딩으로 확정
    content = content.encode("UTF-8")

    # headers: true 시 CSV::Table 반환 → CSV::Row 객체로 헤더 접근 가능
    CSV.parse(content, headers: true)
  rescue CSV::MalformedCSVError => e
    raise "CSV 형식 오류: #{e.message}"
  end

  def valid_row?(row)
    REQUIRED_COLUMNS.all? { |col| row[col].present? }
  end
end
