'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { ReactQueryProvider } from '@/components/providers/react-query-provider';
import {
  LayoutDashboard,
  Users,
  Car,
  UsersRound,
  Settings,
  Shield,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Bus,
  Route,
  BarChart2,
  Bell,
  FileBarChart,
  MapPin,
  Receipt,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Institution Layout — 기관 관리 포털 공통 레이아웃
 * vehicles / passengers / passenger-groups / settings / safety 공통 사이드바
 */

export default function InstitutionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const institutionId = params.id as string;
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    {
      name: '대시보드',
      href: `/institutions/${institutionId}`,
      icon: LayoutDashboard,
      exact: true,
    },
    {
      name: '승객 관리',
      href: `/institutions/${institutionId}/passengers`,
      icon: Users,
    },
    {
      name: '탑승 그룹',
      href: `/institutions/${institutionId}/passenger-groups`,
      icon: UsersRound,
    },
    {
      name: '차량 관리',
      href: `/institutions/${institutionId}/vehicles`,
      icon: Car,
    },
    {
      name: 'BI 대시보드',
      href: `/institutions/${institutionId}/analytics`,
      icon: BarChart2,
    },
    {
      name: '경로 최적화',
      href: `/institutions/${institutionId}/rosters`,
      icon: Route,
    },
    {
      name: '안전 대시보드',
      href: `/institutions/${institutionId}/safety`,
      icon: Shield,
    },
    {
      name: '알림 현황',
      href: `/institutions/${institutionId}/notifications`,
      icon: Bell,
    },
    {
      name: '보험 리스크',
      href: `/institutions/${institutionId}/risk-report`,
      icon: FileBarChart,
    },
    {
      name: '운행 이력',
      href: `/institutions/${institutionId}/trips`,
      icon: MapPin,
    },
    {
      name: '정산 관리',
      href: `/institutions/${institutionId}/settlements`,
      icon: Receipt,
    },
    {
      name: '결제 관리',
      href: `/institutions/${institutionId}/billing`,
      icon: CreditCard,
    },
    {
      name: '설정',
      href: `/institutions/${institutionId}/settings`,
      icon: Settings,
    },
  ];

  const isActive = (item: (typeof navItems)[0]) => {
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(item.href + '/');
  };

  return (
    <ReactQueryProvider>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed top-0 left-0 z-40 h-screen bg-slate-900 text-white transition-all duration-300 flex flex-col',
            collapsed ? 'w-16' : 'w-60'
          )}
        >
          {/* Logo */}
          <div className="flex items-center gap-3 p-4 border-b border-slate-800 flex-shrink-0">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Bus className="w-5 h-5" />
            </div>
            {!collapsed && (
              <span className="text-base font-semibold truncate">Pickup MaaS</span>
            )}
          </div>

          {/* Nav */}
          <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                    'hover:bg-slate-800',
                    active
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:text-white'
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && (
                    <span className="text-sm font-medium">{item.name}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-3 border-t border-slate-800 flex items-center justify-center hover:bg-slate-800 transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            ) : (
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <ChevronLeft className="w-4 h-4" />
                <span>접기</span>
              </div>
            )}
          </button>
        </aside>

        {/* Main Content */}
        <main
          className={cn(
            'flex-1 transition-all duration-300 min-h-screen',
            collapsed ? 'ml-16' : 'ml-60'
          )}
        >
          {children}
        </main>
      </div>
    </ReactQueryProvider>
  );
}
