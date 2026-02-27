'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Clock, Truck, Users, TrendingUp, DollarSign } from 'lucide-react';
import { useAdminStats, useRevenueStats } from '@/hooks/use-admin-stats';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';

/**
 * T546-T555: Admin Dashboard Home
 *
 * KPI cards, recent institutions, quick actions
 */

export default function AdminDashboardPage() {
  const router = useRouter();
  const { stats, loading: statsLoading } = useAdminStats();
  const { stats: revenue, loading: revenueLoading } = useRevenueStats();

  if (statsLoading || revenueLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
        <p className="text-gray-600 mt-2">
          Pickup MaaS 관리자 대시보드
        </p>
      </div>

      {/* KPI Cards Grid - T547 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Institutions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              전체 회원사
            </CardTitle>
            <Building2 className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.institutions.total || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              활성: {stats?.institutions.active || 0} | 정지: {stats?.institutions.suspended || 0}
            </p>
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-yellow-900">
              승인 대기
            </CardTitle>
            <Clock className="w-4 h-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">
              {stats?.institutions.pending || 0}
            </div>
            <Button
              size="sm"
              variant="link"
              className="text-xs p-0 h-auto mt-1 text-yellow-700"
              onClick={() => router.push('/admin/institutions/pending')}
            >
              승인 관리 →
            </Button>
          </CardContent>
        </Card>

        {/* New This Month */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              이번 달 신규 가입
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.newInstitutionsThisMonth || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
            </p>
          </CardContent>
        </Card>

        {/* Total Vehicles */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              총 차량 수
            </CardTitle>
            <Truck className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.vehicles.total || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              전체 회원사 차량
            </p>
          </CardContent>
        </Card>

        {/* Total Passengers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              총 승객 수
            </CardTitle>
            <Users className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.passengers.total || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              전체 회원사 승객
            </p>
          </CardContent>
        </Card>

        {/* Monthly Revenue */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-900">
              이번 달 매출 (예상)
            </CardTitle>
            <DollarSign className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {(revenue?.totalMonthlyRevenue || 0).toLocaleString()}원
            </div>
            <p className="text-xs text-green-700 mt-1">
              활성 구독: {revenue?.activeSubscriptions || 0}개
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions - T549 */}
      <Card>
        <CardHeader>
          <CardTitle>빠른 작업</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-start"
              onClick={() => router.push('/admin/institutions/pending')}
            >
              <Clock className="w-5 h-5 mb-2 text-yellow-600" />
              <div className="text-left">
                <div className="font-medium">승인 대기 관리</div>
                <div className="text-sm text-gray-500">
                  {stats?.institutions.pending || 0}건 대기 중
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-start"
              onClick={() => router.push('/admin/institutions')}
            >
              <Building2 className="w-5 h-5 mb-2 text-blue-600" />
              <div className="text-left">
                <div className="font-medium">회원사 관리</div>
                <div className="text-sm text-gray-500">
                  전체 {stats?.institutions.total || 0}개 회원사
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-start"
              onClick={() => router.push('/admin/stats')}
            >
              <TrendingUp className="w-5 h-5 mb-2 text-green-600" />
              <div className="text-left">
                <div className="font-medium">통계 보기</div>
                <div className="text-sm text-gray-500">
                  매출 및 사용 현황
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Institution Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>회원사 상태 분포</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-sm">활성 (ACTIVE)</span>
              </div>
              <span className="font-medium">{stats?.institutions.active || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                <span className="text-sm">승인 대기 (PENDING)</span>
              </div>
              <span className="font-medium">{stats?.institutions.pending || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <span className="text-sm">정지 (SUSPENDED)</span>
              </div>
              <span className="font-medium">{stats?.institutions.suspended || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-400 rounded-full" />
                <span className="text-sm">비활성 (INACTIVE)</span>
              </div>
              <span className="font-medium">{stats?.institutions.inactive || 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
