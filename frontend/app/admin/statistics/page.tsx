'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient, User, DashboardStats, InstitutionStat, RecentActivity } from '@/lib/api';
import { PageContainer } from '@/components/admin/page-container';
import { AdminHeader } from '@/components/admin/admin-header';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Building2,
  Truck,
  Users,
  Route,
  CheckCircle,
  Clock,
  TrendingUp,
  Activity
} from 'lucide-react';

export default function StatisticsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [institutionStats, setInstitutionStats] = useState<InstitutionStat[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await apiClient.getCurrentUser();
        setUser(userData);
      } catch (error) {
        router.push('/admin/login');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [router]);

  useEffect(() => {
    if (user) {
      loadAllStats();
    }
  }, [user]);

  const loadAllStats = async () => {
    try {
      const [dashboardData, institutionData, activityData] = await Promise.all([
        apiClient.getDashboardStats(),
        apiClient.getInstitutionStats(),
        apiClient.getRecentActivity(15),
      ]);

      setStats(dashboardData);
      setInstitutionStats(institutionData);
      setRecentActivity(activityData);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  if (loading || !stats) {
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
        user={user}
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
                    <div className="text-2xl font-bold">{stats.institutions.total}</div>
                    <p className="text-xs text-green-600 mt-1">
                      활성: {stats.institutions.active} / 대기: {stats.institutions.pending}
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
                    <div className="text-2xl font-bold">{stats.vehicles.total}</div>
                    <p className="text-xs text-green-600 mt-1">
                      활성: {stats.vehicles.active}대
                    </p>
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
                    <div className="text-2xl font-bold">{stats.passengers.total}</div>
                    <p className="text-xs text-gray-500 mt-1">등록된 승객</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-600 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">경로 최적화</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{stats.routes.optimized}</div>
                    <p className="text-xs text-gray-500 mt-1">
                      전체: {stats.routes.total}건
                    </p>
                  </div>
                  <Route className="w-8 h-8 text-orange-600 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 운행 통계 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                운행 통계 ({stats.trips.period})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">총 운행</p>
                  <p className="text-3xl font-bold">{stats.trips.total}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">완료</p>
                  <p className="text-3xl font-bold text-green-600">{stats.trips.completed}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">진행 중</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.trips.inProgress}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">완료율</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.trips.completionRate}%</p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <p className="text-sm font-medium mb-3">체크인 통계 ({stats.checkIns.period})</p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">총 체크인</p>
                    <p className="text-2xl font-bold">{stats.checkIns.total}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">탑승</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.checkIns.boarding}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">하차</p>
                    <p className="text-2xl font-bold text-green-600">{stats.checkIns.alighting}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 기관별 통계 */}
          <Card>
            <CardHeader>
              <CardTitle>기관별 운영 현황 (상위 10개)</CardTitle>
              <CardDescription>각 기관의 운행 통계입니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {institutionStats.map((inst) => (
                  <div key={inst.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-grow">
                        <p className="font-medium">{inst.name}</p>
                        <p className="text-sm text-gray-500">{inst.businessRegistrationNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">{inst.completionRate}%</p>
                        <p className="text-xs text-gray-500">완료율</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4 mt-3 text-sm">
                      <div>
                        <p className="text-gray-500">차량</p>
                        <p className="font-semibold">{inst.vehicleCount}대</p>
                      </div>
                      <div>
                        <p className="text-gray-500">승객</p>
                        <p className="font-semibold">{inst.passengerCount}명</p>
                      </div>
                      <div>
                        <p className="text-gray-500">총 운행</p>
                        <p className="font-semibold">{inst.totalTrips}건</p>
                      </div>
                      <div>
                        <p className="text-gray-500">완료</p>
                        <p className="font-semibold text-green-600">{inst.completedTrips}건</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 최근 활동 */}
          {recentActivity && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* 최근 운행 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    최근 운행
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentActivity.trips.slice(0, 10).map((trip) => (
                      <div key={trip.id} className="p-3 border rounded-lg text-sm">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium">{trip.institutionName}</p>
                            <p className="text-xs text-gray-500">{trip.vehiclePlate}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded ${
                            trip.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                            trip.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {trip.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <span>{trip.shuttleType}</span>
                          <span>
                            {new Date(trip.scheduledStartTime).toLocaleString('ko-KR', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 최근 체크인 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    최근 체크인
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentActivity.checkIns.slice(0, 10).map((checkIn) => (
                      <div key={checkIn.id} className="p-3 border rounded-lg text-sm">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium">{checkIn.passengerName}</p>
                            <p className="text-xs text-gray-500">{checkIn.institutionName}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded ${
                            checkIn.checkType === 'BOARDING' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {checkIn.checkType === 'BOARDING' ? '탑승' : '하차'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Clock className="w-3 h-3" />
                          <span>
                            {new Date(checkIn.createdAt).toLocaleString('ko-KR', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </PageContainer>
  );
}
