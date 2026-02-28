'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { User, Lock, Info } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { PageContainer } from '@/components/admin/page-container';
import { AdminHeader } from '@/components/admin/admin-header';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function AdminSettings() {
  const { user, loading } = useAuth();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 폼 상태
  const [email, setEmail] = useState(user?.email ?? '');
  const [name, setName] = useState(user?.name ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (user) {
      setEmail(user.email);
      setName(user.name);
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage(null);

    try {
      const updates: Record<string, string> = {};
      if (email !== user.email) updates.email = email;
      if (name !== user.name) updates.name = name;

      if (Object.keys(updates).length > 0) {
        const { railsClient } = await import('@/lib/rails-client');
        await railsClient.patch(`/admin/users/${user.id}`, { user: updates });
        setMessage({ type: 'success', text: '프로필이 성공적으로 업데이트되었습니다.' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || '업데이트에 실패했습니다.' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: '새 비밀번호가 일치하지 않습니다.' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: '비밀번호는 최소 6자 이상이어야 합니다.' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const { railsClient } = await import('@/lib/rails-client');
      await railsClient.patch(`/admin/users/${user.id}`, { user: { password: newPassword } });
      setMessage({ type: 'success', text: '비밀번호가 성공적으로 변경되었습니다.' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || '비밀번호 변경에 실패했습니다.' });
    } finally {
      setSaving(false);
    }
  };

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
        title="계정 설정"
        subtitle="프로필 및 비밀번호 관리"
        user={user as any}
        showBackButton={true}
        backHref="/admin/dashboard"
      />

      <main className="container max-w-2xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* 알림 메시지 */}
          {message && (
            <div
              className={`p-4 rounded-md ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* 프로필 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                프로필 정보
              </CardTitle>
              <CardDescription>
                이름과 이메일을 변경할 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">이름</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={saving}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">이메일</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={saving}
                    required
                  />
                </div>
                <Button type="submit" disabled={saving}>
                  {saving ? '저장 중...' : '프로필 업데이트'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* 비밀번호 변경 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-purple-600" />
                비밀번호 변경
              </CardTitle>
              <CardDescription>
                새로운 비밀번호를 설정합니다. (최소 6자 이상)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">새 비밀번호</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={saving}
                    placeholder="최소 6자 이상"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">새 비밀번호 확인</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={saving}
                    placeholder="비밀번호 재입력"
                  />
                </div>
                <Button type="submit" disabled={saving || !newPassword || !confirmPassword}>
                  {saving ? '변경 중...' : '비밀번호 변경'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* 계정 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5 text-indigo-600" />
                계정 정보
              </CardTitle>
              <CardDescription>
                현재 계정의 상세 정보입니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">사용자 ID:</span>
                <span className="font-mono">{user?.id}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">역할:</span>
                <span className="font-medium">{user?.role}</span>
              </div>
              {user?.institutionId && (
                <>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">기관 ID:</span>
                    <span className="font-mono">{user.institutionId}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </PageContainer>
  );
}
