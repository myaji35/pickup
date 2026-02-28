'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { PageContainer } from '@/components/admin/page-container';
import { AdminHeader } from '@/components/admin/admin-header';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Building2, Truck, Users, TrendingUp } from 'lucide-react';

interface AdminStats {
  total_institutions: number;
  pending_count: number;
  active_count: number;
  suspended_count: number;
  total_vehicles: number;
  total_passengers: number;
  new_this_month: number;
}

export default function StatisticsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const { railsClient } = await import('@/lib/rails-client');
        const data = await railsClient.get<AdminStats>('/admin/institutions/stats');
        setStats(data);
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading) {
    return (
      <PageContainer>
        <LoadingSpinner size="lg" />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <AdminHeader
        title="통계 대시보드"
        subtitle="실시간 운영 통계 및 리포트"
        user={user as any}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* 주요 지표 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">총 기관</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{stats?.total_institutions ?? 0}</div>
                    <p className="text-xs text-green-600 mt-1">
                      활성: {stats?.active_count ?? 0} / 대기: {stats?.pending_count ?? 0}
                    </p>
                  </div>
                  <Building2 className="w-8 h-8 text-purple-600 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">총 차량</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{stats?.total_vehicles ?? 0}</div>
                    <p className="text-xs text-green-600 mt-1">등록 차량</p>
                  </div>
                  <Truck className="w-8 h-8 text-indigo-600 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">총 승객</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{stats?.total_passengers ?? 0}</div>
                    <p className="text-xs text-gray-500 mt-1">등록된 승객</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">이번 달 신규</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{stats?.new_this_month ?? 0}</div>
                    <p className="text-xs text-gray-500 mt-1">신규 기관</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-orange-600 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 기관 상태 요약 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                기관 상태 현황
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">{stats?.active_count ?? 0}</p>
                  <p className="text-sm text-gray-500 mt-1">활성</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-yellow-600">{stats?.pending_count ?? 0}</p>
                  <p className="text-sm text-gray-500 mt-1">승인 대기</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-600">{stats?.suspended_count ?? 0}</p>
                  <p className="text-sm text-gray-500 mt-1">정지됨</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">{stats?.new_this_month ?? 0}</p>
                  <p className="text-sm text-gray-500 mt-1">이번 달 신규</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </PageContainer>
  );
}
