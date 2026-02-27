##
# TossPaymentsService — 토스페이먼츠 API 연동
#
# 환경변수:
#   TOSS_SECRET_KEY — 토스페이먼츠 시크릿 키 (sk_test_... or sk_live_...)
#   TOSS_CLIENT_KEY — 토스페이먼츠 클라이언트 키
#
# 사용 예시:
#   svc = TossPaymentsService.new
#   result = svc.issue_billing_key(auth_key: "...", customer_key: "...")
#   result = svc.charge(billing_key: "...", amount: 300_000, order_id: "ORD-xxx")
#   result = svc.confirm_payment(payment_key: "...", order_id: "...", amount: 300_000)
##
class TossPaymentsService
  BASE_URL = "https://api.tosspayments.com/v1".freeze

  class TossPaymentsError < StandardError
    attr_reader :code, :message
    def initialize(code:, message:)
      @code    = code
      @message = message
      super("TossPayments Error [#{code}]: #{message}")
    end
  end

  # ── 빌링키 발급 (카드 자동결제 등록) ─────────────────────────────────────
  # auth_key: 클라이언트에서 전달받은 인증 키
  # customer_key: 기관 고유 식별자 (institution_id 기반 권장)
  def issue_billing_key(auth_key:, customer_key:)
    post("/billing/authorizations/issue", {
      authKey:     auth_key,
      customerKey: customer_key,
    })
  end

  # ── 빌링키로 결제 ─────────────────────────────────────────────────────────
  # billing_key: 발급된 빌링키
  # amount: 결제 금액 (KRW 정수)
  # order_id: 주문 고유 ID (내부 생성)
  # order_name: 결제 내역 표시명
  def charge(billing_key:, amount:, order_id:, order_name: "Pickup MaaS 구독")
    post("/billing/#{billing_key}", {
      customerKey: order_id.split("-").first,  # convention: "INST{id}-YYYYMM"
      amount:      amount,
      orderId:     order_id,
      orderName:   order_name,
    })
  end

  # ── 일반 결제 승인 (카드 최초 등록 시 위젯 플로우) ───────────────────────
  def confirm_payment(payment_key:, order_id:, amount:)
    post("/payments/confirm", {
      paymentKey: payment_key,
      orderId:    order_id,
      amount:     amount,
    })
  end

  # ── 결제 조회 ─────────────────────────────────────────────────────────────
  def get_payment(payment_key)
    get("/payments/#{payment_key}")
  end

  # ── 결제 취소 / 환불 ──────────────────────────────────────────────────────
  def cancel_payment(payment_key:, cancel_reason:, cancel_amount: nil)
    body = { cancelReason: cancel_reason }
    body[:cancelAmount] = cancel_amount if cancel_amount
    post("/payments/#{payment_key}/cancel", body)
  end

  private

  def secret_key
    ENV.fetch("TOSS_SECRET_KEY", "test_sk_placeholder")
  end

  def headers
    encoded = Base64.strict_encode64("#{secret_key}:")
    {
      "Authorization"  => "Basic #{encoded}",
      "Content-Type"   => "application/json",
    }
  end

  def post(path, body)
    uri  = URI("#{BASE_URL}#{path}")
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true

    req = Net::HTTP::Post.new(uri.path, headers)
    req.body = body.to_json

    parse_response(http.request(req))
  end

  def get(path)
    uri  = URI("#{BASE_URL}#{path}")
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true

    req = Net::HTTP::Get.new(uri.path, headers)
    parse_response(http.request(req))
  end

  def parse_response(response)
    body = JSON.parse(response.body)

    if response.is_a?(Net::HTTPSuccess)
      body
    else
      raise TossPaymentsError.new(
        code:    body["code"]    || response.code,
        message: body["message"] || "Unknown error",
      )
    end
  end
end
