##
# NAVER CLOVA OCR 서비스
#
# 환경변수:
#   CLOVA_OCR_API_URL   — CLOVA OCR Invoke URL
#   CLOVA_OCR_SECRET    — Secret Key
#
# 미설정 시 시뮬레이션 모드 (개발/테스트)
##
class ClovaOcrService
  API_URL = ENV['CLOVA_OCR_API_URL']
  SECRET  = ENV['CLOVA_OCR_SECRET']

  # image_url: 이미지 URL 또는 Base64 문자열
  # 반환: { amount:, vendor:, date:, raw: }
  def self.extract(image_url)
    return simulate(image_url) unless configured?

    payload = {
      version: 'V2',
      requestId: SecureRandom.uuid,
      timestamp: (Time.current.to_f * 1000).to_i,
      images: [
        { format: 'jpg', name: 'receipt', url: image_url }
      ]
    }.to_json

    uri = URI(API_URL)
    req = Net::HTTP::Post.new(uri)
    req['X-OCR-SECRET']  = SECRET
    req['Content-Type']  = 'application/json'
    req.body             = payload

    res = Net::HTTP.start(uri.hostname, uri.port, use_ssl: uri.scheme == 'https') do |http|
      http.request(req)
    end

    parse_response(res.body)
  rescue => e
    Rails.logger.error "[ClovaOCR] 오류: #{e.message}"
    { amount: nil, vendor: nil, date: nil, raw: nil, error: e.message }
  end

  # ─── 내부 파싱 ────────────────────────────────────────────────

  def self.parse_response(body)
    data = JSON.parse(body)
    image = data.dig('images', 0)
    return { amount: nil, vendor: nil, date: nil, raw: body } unless image

    fields = image.dig('receipt', 'result') || {}

    amount_text = fields.dig('totalPrice', 'price', 'formatted', 'value')
    vendor_text = fields.dig('storeInfo', 'name', 'formatted', 'value')
    date_text   = fields.dig('paymentInfo', 'date', 'formatted', 'value')

    amount = amount_text.to_s.gsub(/[^0-9]/, '').to_i if amount_text
    date   = parse_date(date_text)

    { amount: amount, vendor: vendor_text, date: date, raw: body }
  rescue => e
    { amount: nil, vendor: nil, date: nil, raw: body, error: e.message }
  end
  private_class_method :parse_response

  def self.parse_date(str)
    return nil unless str.present?
    Date.parse(str.gsub(/[.년월]/, '-').gsub('일', '').strip)
  rescue
    nil
  end
  private_class_method :parse_date

  def self.configured?
    API_URL.present? && SECRET.present?
  end
  private_class_method :configured?

  # 개발 환경 시뮬레이션
  def self.simulate(image_url)
    Rails.logger.info "[ClovaOCR SIMULATE] image: #{image_url}"
    {
      amount: rand(10_000..150_000),
      vendor: '홍길동주유소',
      date:   Date.today,
      raw:    '{"simulated":true}'
    }
  end
  private_class_method :simulate
end
