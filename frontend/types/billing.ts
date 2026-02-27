/**
 * Billing & Subscription Types — Epic 12
 */

export interface SubscriptionStatus {
  id: number;
  status: 'trial' | 'active' | 'expired' | 'cancelled' | 'suspended';
  plan_code: string;
  plan_name: string;
  start_date: string;
  end_date: string | null;
  trial_ends_at: string | null;
  next_billing_date: string | null;
  failed_payment_count: number;
  has_billing_key: boolean;
  in_trial: boolean;
  days_until_billing: number | null;
}

export interface PlanInfo {
  id: number;
  code: string;
  name: string;
  monthly_price: number;
  features: Record<string, unknown>;
}

export interface BillingStatusResponse {
  subscription: SubscriptionStatus | null;
  plan: PlanInfo | null;
  has_billing: boolean;
  message?: string;
  last_payment: LastPayment | null;
}

export interface LastPayment {
  status: string;
  amount: number;
  paid_at: string | null;
  card: string | null;
}

export interface PaymentRecord {
  id: number;
  order_id: string;
  amount: number;
  status: 'pending' | 'success' | 'failed' | 'refunded';
  card_company: string | null;
  card_number: string | null;
  paid_at: string | null;
  failure_reason: string | null;
  invoice_number: string | null;
  created_at: string;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  amount: number;
  tax_amount: number;
  total: number;
  issue_date: string;
  due_date: string | null;
  status: 'issued' | 'sent' | 'overdue';
  pdf_url: string | null;
}

// 슈퍼어드민용
export interface AdminSubscription {
  id: number;
  institution_id: number;
  institution_name: string;
  plan_code: string;
  plan_name: string;
  monthly_price: number;
  status: string;
  start_date: string;
  end_date: string | null;
  trial_ends_at: string | null;
  next_billing_date: string | null;
  failed_payment_count: number;
  has_billing_key: boolean;
  notes: string | null;
  created_at: string;
}
