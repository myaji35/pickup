/**
 * Analytics Hooks — Epic 10 BI 대시보드
 */

import { useQuery } from '@tanstack/react-query';
import { railsClient } from '@/lib/rails-client';
import {
  AnalyticsOverview,
  TripTrendsResponse,
  SafetyAnalyticsResponse,
  PassengerAnalyticsResponse,
} from '@/types/analytics';

export function useAnalyticsOverview() {
  return useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => railsClient.get<AnalyticsOverview>('/institutions/analytics/overview'),
    staleTime: 5 * 60 * 1000, // 5분 캐시
  });
}

export function useTripTrends(weeks = 12) {
  return useQuery({
    queryKey: ['analytics', 'trips', weeks],
    queryFn: () =>
      railsClient.get<TripTrendsResponse>('/institutions/analytics/trips', { weeks }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSafetyAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'safety'],
    queryFn: () => railsClient.get<SafetyAnalyticsResponse>('/institutions/analytics/safety'),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePassengerAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'passengers'],
    queryFn: () =>
      railsClient.get<PassengerAnalyticsResponse>('/institutions/analytics/passengers'),
    staleTime: 5 * 60 * 1000,
  });
}
