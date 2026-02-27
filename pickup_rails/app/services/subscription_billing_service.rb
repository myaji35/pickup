##
# SubscriptionBillingService — 구독 결제 처리 서비스
#
# 담당:
#   - 빌링키 저장 (카드 등록 완료 후)
#   - 단건 자동 결제 실행
#   - 결제 결과 → payment_records, invoices 생성
#   - 실패 시 failed_payment_count 증가 + 3회 초과 시 suspended 처리
##
class SubscriptionBillingService
  MAX_RETRY = 3

  def initialize(subscription)
    @subscription = subscription
    @institution  = subscription.institution
    @plan         = subscription.plan
    @toss         = TossPaymentsService.new
  end

  # ── 빌링키 저장 (카드 등록 완료 콜백) ───────────────────────────────────
  def save_billing_key!(auth_key:)
    customer_key = "INST#{@institution.id}"
    result = @toss.issue_billing_key(auth_key: auth_key, customer_key: customer_key)

    billing_key = result["billingKey"] || result["billing_key"]
    raise "빌링키 발급 실패: #{result}" if billing_key.blank?

    @subscription.update!(
      toss_billing_key:   billing_key,
      status:             :active,
      next_billing_date:  Date.today.next_month,
      failed_payment_count: 0,
    )

    billing_key
  end

  # ── 자동 결제 실행 ────────────────────────────────────────────────────────
  def charge!
    raise "빌링키 없음" if @subscription.toss_billing_key.blank?

    amount    = @plan.monthly_price.to_i
    order_id  = generate_order_id
    order_name = "#{@plan.name} 구독 (#{Date.today.strftime('%Y년 %m월')})"

    record = PaymentRecord.create!(
      subscription:  @subscription,
      institution:   @institution,
      toss_order_id: order_id,
      amount_krw:    amount,
      status:        'pending',
    )

    begin
      result = @toss.charge(
        billing_key: @subscription.toss_billing_key,
        amount:      amount,
        order_id:    order_id,
        order_name:  order_name,
      )

      payment_key  = result["paymentKey"]
      card_company = result.dig("card", "company")
      card_number  = result.dig("card", "number")

      record.update!(
        toss_payment_key:  payment_key,
        status:            'success',
        card_company:      card_company,
        card_number_masked: card_number,
        paid_at:           Time.current,
      )

      # 구독 갱신
      @subscription.update!(
        status:               :active,
        next_billing_date:    Date.today.next_month,
        failed_payment_count: 0,
      )

      # 인보이스 발행
      issue_invoice!(record)

      record
    rescue TossPaymentsService::TossPaymentsError => e
      record.update!(status: 'failed', failure_reason: e.message)
      handle_failure!
      raise e
    end
  end

  # ── 환불 처리 ────────────────────────────────────────────────────────────
  def refund!(payment_record, reason: "고객 요청 환불")
    raise "성공한 결제만 환불 가능" unless payment_record.success?

    @toss.cancel_payment(
      payment_key:   payment_record.toss_payment_key,
      cancel_reason: reason,
    )

    payment_record.update!(status: 'refunded')
  end

  private

  def generate_order_id
    "INST#{@institution.id}-#{Date.today.strftime('%Y%m')}-#{SecureRandom.hex(4).upcase}"
  end

  def handle_failure!
    count = @subscription.failed_payment_count + 1
    if count >= MAX_RETRY
      @subscription.update!(status: :suspended, failed_payment_count: count)
    else
      @subscription.update!(failed_payment_count: count)
    end
  end

  def issue_invoice!(payment_record)
    tax = (payment_record.amount_krw * 0.1).round  # 부가세 10%
    Invoice.create!(
      payment_record: payment_record,
      institution:    @institution,
      amount_krw:     payment_record.amount_krw,
      tax_amount_krw: tax,
      issue_date:     Date.today,
      due_date:       Date.today + 7,
      status:         'issued',
    )
  end
end
