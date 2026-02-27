/**
 * Billing Hooks — Epic 12
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { railsClient } from '@/lib/rails-client';
import {
  BillingStatusResponse,
  PaymentRecord,
  Invoice,
  AdminSubscription,
} from '@/types/billing';

// ─── 기관 결제 상태 ─────────────────────────────────────────────────────────
export function useBillingStatus() {
  return useQuery({
    queryKey: ['billing', 'status'],
    queryFn: () => railsClient.get<BillingStatusResponse>('/institutions/billing/status'),
    staleTime: 30 * 1000, // 30초
  });
}

// ─── 결제 이력 ───────────────────────────────────────────────────────────────
export function usePaymentHistory() {
  return useQuery({
    queryKey: ['billing', 'history'],
    queryFn: () => railsClient.get<PaymentRecord[]>('/institutions/billing/history'),
  });
}

// ─── 인보이스 목록 ────────────────────────────────────────────────────────────
export function useInvoices() {
  return useQuery({
    queryKey: ['billing', 'invoices'],
    queryFn: () => railsClient.get<Invoice[]>('/institutions/billing/invoices'),
  });
}

// ─── 카드 등록 (빌링키 발급) ──────────────────────────────────────────────────
export function useRegisterCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (authKey: string) =>
      railsClient.post<{ message: string; billing_enabled: boolean }>(
        '/institutions/billing/register_card',
        { auth_key: authKey }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['billing'] });
    },
  });
}

// ─── 플랜 변경 ───────────────────────────────────────────────────────────────
export function useChangePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (planCode: string) =>
      railsClient.post<{ message: string }>('/institutions/billing/change_plan', {
        plan_code: planCode,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['billing'] });
    },
  });
}

// ─── 슈퍼어드민: 전체 구독 목록 ─────────────────────────────────────────────
export function useAdminSubscriptions(status?: string) {
  return useQuery({
    queryKey: ['admin', 'subscriptions', status],
    queryFn: () =>
      railsClient.get<AdminSubscription[]>('/admin/subscriptions', {
        ...(status ? { status } : {}),
      }),
  });
}

// ─── 슈퍼어드민: 플랜 변경 ──────────────────────────────────────────────────
export function useAdminChangePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, planCode }: { id: number; planCode: string }) =>
      railsClient.patch<AdminSubscription>(`/admin/subscriptions/${id}/plan`, {
        plan_code: planCode,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
    },
  });
}

// ─── 슈퍼어드민: 구독 활성화 ────────────────────────────────────────────────
export function useAdminActivateSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      railsClient.post<{ message: string }>(`/admin/subscriptions/${id}/activate`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
    },
  });
}

// ─── 슈퍼어드민: 구독 정지 ──────────────────────────────────────────────────
export function useAdminSuspendSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      railsClient.post<{ message: string }>(`/admin/subscriptions/${id}/suspend`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
    },
  });
}
