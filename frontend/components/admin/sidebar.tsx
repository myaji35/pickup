'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Building2,
  Clock,
  Users,
  CreditCard,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Bus,
  Receipt,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * T537: Sidebar Navigation
 *
 * Admin sidebar with navigation links:
 * - Dashboard
 * - Institutions (with pending badge)
 * - Users
 * - Plans
 * - Statistics
 */

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navigation = [
  {
    name: '대시보드',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: '회원사 관리',
    href: '/admin/institutions',
    icon: Building2,
  },
  {
    name: '승인 대기',
    href: '/admin/institutions/pending',
    icon: Clock,
    badge: true, // Will show badge count from API
  },
  {
    name: '사용자 관리',
    href: '/admin/users',
    icon: Users,
  },
  {
    name: '요금제 관리',
    href: '/admin/plans',
    icon: CreditCard,
  },
  {
    name: '통계',
    href: '/admin/statistics',
    icon: BarChart3,
  },
  {
    name: '구독 관리',
    href: '/admin/subscriptions',
    icon: Receipt,
  },
];

export function AdminSidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const { railsClient } = await import('@/lib/rails-client');
        const raw = await railsClient.getRaw<{ meta?: { total_count: number } }>('/admin/institutions/pending');
        setPendingCount(raw?.meta?.total_count ?? 0);
      } catch {
        // 조용히 실패
      }
    };
    fetchPendingCount();
  }, []);

  return (
    <>
      {/* Mobile Overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen bg-slate-900 text-white transition-all duration-300',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Logo & Brand */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-800">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Bus className="w-6 h-6" />
          </div>
          {!collapsed && (
            <span className="text-lg font-semibold">Pickup Admin</span>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-2 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                  'hover:bg-slate-800',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:text-white'
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.name}</span>
                    {item.badge && pendingCount > 0 && (
                      <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {pendingCount}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Collapse Toggle */}
        <button
          onClick={onToggle}
          className="absolute bottom-4 right-4 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors hidden lg:block"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </aside>
    </>
  );
}
