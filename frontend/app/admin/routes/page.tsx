'use client';

import { useAuth } from '@/contexts/auth-context';
import { PageContainer } from '@/components/admin/page-container';
import { AdminHeader } from '@/components/admin/admin-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Route, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function RoutesPage() {
  const { user } = useAuth();

  return (
    <PageContainer>
      <AdminHeader
        title="경로 최적화"
        subtitle="AI 기반 VRP 경로 최적화"
        user={user as any}
      />
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="w-5 h-5 text-blue-600" />
              경로 최적화 안내
            </CardTitle>
            <CardDescription>
              VRP 경로 최적화는 각 기관의 탑승 명단(Roster) 페이지에서 실행합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-900">
                기관 포털 → 탑승그룹 → 해당 로스터 선택 → <strong>경로 최적화</strong> 버튼을 클릭하세요.
              </p>
            </div>
            <Link
              href="/admin/institutions"
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium">기관 목록으로 이동</span>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </Link>
          </CardContent>
        </Card>
      </main>
    </PageContainer>
  );
}
