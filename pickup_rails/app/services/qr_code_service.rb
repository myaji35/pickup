##
# QrCodeService — 승객 체크인용 QR 코드 생성 및 검증
#
# QR 내용 (JSON):
#   {
#     "type":           "passenger_checkin",
#     "passenger_id":   123,
#     "institution_id": 45,
#     "date":           "2026-03-01",   ← 일별 유효 (daily rotation)
#     "checksum":       "<HMAC-SHA256>"
#   }
#
# 보안:
#   - HMAC-SHA256(passenger_id + institution_id + date + SECRET_KEY)
#   - 당일 운행에만 사용 가능
#   - 재사용 방지: check_ins.trip_id + passenger_id UNIQUE 제약 (기존)
##
require "openssl"
require "json"
require "base64"

class QrCodeService
  SECRET_KEY = ENV.fetch("QR_SECRET_KEY", Rails.application.secret_key_base)

  # ── QR 코드 PNG 데이터 생성 ──────────────────────────────────────
  # Returns: Base64-encoded PNG string
  def self.generate_png(passenger, date: Date.current)
    payload = build_payload(passenger, date)
    json    = payload.to_json

    qr = RQRCode::QRCode.new(json, level: :m)

    # SVG → PNG 변환 (chunky_png 사용)
    png = qr.as_png(
      bit_depth:    1,
      border_modules: 4,
      color_mode:   ChunkyPNG::COLOR_GRAYSCALE,
      color:        "000",
      file:         nil,
      fill:         "fff",
      module_px_size: 6,
      resize_exactly_to: nil,
      resize_gte_to: nil,
    )

    png.to_blob
  end

  # ── QR 코드 SVG 문자열 생성 (HTML 임베드용) ──────────────────────
  def self.generate_svg(passenger, date: Date.current)
    payload = build_payload(passenger, date)
    qr = RQRCode::QRCode.new(payload.to_json, level: :m)
    qr.as_svg(
      offset:          0,
      color:           "000",
      shape_rendering: "crispEdges",
      module_size:     6,
      standalone:      true,
    )
  end

  # ── QR 코드 검증 ──────────────────────────────────────────────────
  # Returns: { valid: bool, passenger_id:, institution_id: } or { valid: false, error: }
  def self.verify(json_string, institution_id:)
    data = JSON.parse(json_string, symbolize_names: true)

    return { valid: false, error: "QR 타입 오류" } unless data[:type] == "passenger_checkin"
    return { valid: false, error: "기관 불일치" } if data[:institution_id].to_i != institution_id.to_i

    # 날짜 유효성 (당일만 허용)
    qr_date = Date.parse(data[:date].to_s)
    return { valid: false, error: "만료된 QR 코드입니다" } if qr_date != Date.current

    # HMAC 검증
    expected = compute_checksum(data[:passenger_id], data[:institution_id], data[:date])
    unless ActiveSupport::SecurityUtils.secure_compare(expected, data[:checksum].to_s)
      return { valid: false, error: "유효하지 않은 QR 코드입니다" }
    end

    { valid: true, passenger_id: data[:passenger_id].to_i, institution_id: data[:institution_id].to_i }
  rescue JSON::ParserError
    { valid: false, error: "QR 코드 형식 오류" }
  rescue Date::Error
    { valid: false, error: "날짜 형식 오류" }
  end

  private

  def self.build_payload(passenger, date)
    {
      type:           "passenger_checkin",
      passenger_id:   passenger.id,
      institution_id: passenger.institution_id,
      date:           date.to_s,
      checksum:       compute_checksum(passenger.id, passenger.institution_id, date.to_s),
    }
  end

  def self.compute_checksum(passenger_id, institution_id, date_str)
    data = "#{passenger_id}:#{institution_id}:#{date_str}"
    OpenSSL::HMAC.hexdigest("SHA256", SECRET_KEY, data)
  end
end
