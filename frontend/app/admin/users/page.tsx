'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';
import { PageContainer } from '@/components/admin/page-container';
import { AdminHeader } from '@/components/admin/admin-header';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Users, Search, Plus, Edit, Trash2, ShieldCheck } from 'lucide-react';

interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: string;
  institution_id: number | null;
  institution_name: string | null;
  created_at: string;
}

const ROLE_LABELS: Record<string, { label: string; className: string }> = {
  super_admin:       { label: '슈퍼어드민', className: 'bg-purple-100 text-purple-800' },
  institution_admin: { label: '기관어드민',  className: 'bg-blue-100 text-blue-800' },
  driver:            { label: '드라이버',    className: 'bg-green-100 text-green-800' },
  passenger:         { label: '승객/보호자', className: 'bg-gray-100 text-gray-800' },
};

export default function UsersPage() {
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [processing, setProcessing] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading) loadUsers();
  }, [authLoading, roleFilter]);

  const loadUsers = async () => {
    try {
      const { railsClient } = await import('@/lib/rails-client');
      const params: Record<string, string> = {};
      if (roleFilter) params.role = roleFilter;
      const data = await railsClient.get<AdminUser[]>('/admin/users', params);
      setUsers(data ?? []);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId: number, userName: string) => {
    if (!confirm(`${userName} 사용자를 삭제하시겠습니까?`)) return;
    setProcessing(userId);
    try {
      const { railsClient } = await import('@/lib/rails-client');
      await railsClient.delete(`/admin/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (error: any) {
      alert(`삭제 실패: ${error.message}`);
    } finally {
      setProcessing(null);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

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
        title="사용자 관리"
        subtitle="전체 사용자 조회 및 관리"
        user={user as any}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* 필터 영역 */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              {[
                { value: '', label: '전체' },
                { value: 'super_admin', label: '슈퍼어드민' },
                { value: 'institution_admin', label: '기관어드민' },
                { value: 'driver', label: '드라이버' },
                { value: 'passenger', label: '승객/보호자' },
              ].map((r) => (
                <Button
                  key={r.value}
                  variant={roleFilter === r.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRoleFilter(r.value)}
                >
                  {r.label}
                </Button>
              ))}
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="이름 또는 이메일 검색"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* 결과 수 */}
          <p className="text-sm text-gray-500">
            총 <strong>{filteredUsers.length}</strong>명
          </p>

          {/* 사용자 목록 */}
          {filteredUsers.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p>사용자가 없습니다.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {filteredUsers.map((u) => {
                const roleConfig = ROLE_LABELS[u.role] ?? { label: u.role, className: 'bg-gray-100 text-gray-800' };
                return (
                  <Card key={u.id}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <ShieldCheck className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">{u.name}</p>
                            <p className="text-sm text-gray-500 truncate">{u.email}</p>
                            {u.institution_name && (
                              <p className="text-xs text-gray-400 truncate">{u.institution_name}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className={`px-2 py-1 text-xs rounded font-medium ${roleConfig.className}`}>
                            {roleConfig.label}
                          </span>
                          <span className="text-xs text-gray-400 hidden sm:block">
                            {new Date(u.created_at).toLocaleDateString('ko-KR')}
                          </span>
                          {u.role !== 'super_admin' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDelete(u.id, u.name)}
                              disabled={processing === u.id}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </PageContainer>
  );
}
