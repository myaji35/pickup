'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LogOut } from 'lucide-react';
import { User } from '@/contexts/auth-context';
import { NotificationBell } from './notification-bell';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  user?: User | null;
  showBackButton?: boolean;
  backHref?: string;
}

export function AdminHeader({ title, subtitle, user, showBackButton, backHref = '/admin/dashboard' }: AdminHeaderProps) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('rails_access_token');
    router.push('/admin/login');
  };

  const handleBack = () => {
    router.push(backHref);
  };

  return (
    <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Left side */}
          <div className="flex items-center gap-4">
            {showBackButton && (
              <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                뒤로
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Right side */}
          {user && (
            <div className="flex items-center gap-4">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <NotificationBell />
              <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
                <LogOut className="w-4 h-4" />
                로그아웃
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
