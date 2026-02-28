'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Building2, Truck, BarChart3, Route, Package, CreditCard } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { PageContainer } from '@/components/admin/page-container';
import { AdminHeader } from '@/components/admin/admin-header';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading } = useAuth();

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
        title="관리자 대시보드"
        subtitle="송영 서비스 통합 관리 플랫폼"
        user={user}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          {/* 환영 메시지 */}
          <Card>
            <CardHeader>
              <CardTitle>환영합니다, {user?.name}님!</CardTitle>
              <CardDescription>
                Pickup MaaS 관리자 대시보드입니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm"><span className="font-medium">역할:</span> {user?.role}</p>
                <p className="text-sm"><span className="font-medium">이메일:</span> {user?.email}</p>
                {user?.institutionId && (
                  <p className="text-sm"><span className="font-medium">기관 ID:</span> {user.institutionId}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 빠른 액션 */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/settings')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-600" />
                  계정 설정
                </CardTitle>
                <CardDescription>
                  이메일, 이름, 비밀번호 변경
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/institutions')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-purple-600" />
                  기관 관리
                </CardTitle>
                <CardDescription>
                  기관 승인/거부/정지 관리
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/routes')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Route className="w-5 h-5 text-indigo-600" />
                  경로 최적화
                </CardTitle>
                <CardDescription>
                  AI 기반 VRP 경로 최적화
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-not-allowed opacity-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-emerald-600" />
                  차량 모니터링
                </CardTitle>
                <CardDescription>
                  실시간 차량 현황 (준비 중)
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/plans')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-orange-600" />
                  요금제 관리
                </CardTitle>
                <CardDescription>
                  구독 플랜 생성/수정/삭제
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/subscriptions')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-teal-600" />
                  구독 관리
                </CardTitle>
                <CardDescription>
                  기관별 구독 현황 및 관리
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/admin/statistics')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-pink-600" />
                  통계 대시보드
                </CardTitle>
                <CardDescription>
                  실시간 운영 통계 및 리포트
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </main>
    </PageContainer>
  );
}
