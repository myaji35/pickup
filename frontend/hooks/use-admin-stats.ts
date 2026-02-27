'use client';

import { useState, useEffect } from 'react';

/**
 * T552: useAdminStats Hook
 *
 * Fetch admin statistics from backend API
 */

interface AdminStats {
  institutions: {
    total: number;
    pending: number;
    active: number;
    suspended: number;
    inactive: number;
  };
  vehicles: {
    total: number;
  };
  passengers: {
    total: number;
  };
  newInstitutionsThisMonth: number;
}

interface RevenueStats {
  totalMonthlyRevenue: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  planBreakdown: Array<{
    planName: string;
    planCode: string;
    monthlyPrice: number;
    subscriptionCount: number;
    revenue: number;
  }>;
}

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3012/backend/api/v1'}/admin/stats/overview`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load stats');
      }

      const data = await response.json();
      setStats(data.data);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading, error, refresh: loadStats };
}

export function useRevenueStats() {
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3012/backend/api/v1'}/admin/stats/revenue`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load revenue stats');
      }

      const data = await response.json();
      setStats(data.data);
    } catch (err) {
      console.error('Failed to load revenue stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load revenue');
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading, error, refresh: loadStats };
}
