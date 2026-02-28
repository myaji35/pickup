'use client';

import { Inter } from 'next/font/google';
import { AuthProvider } from '@/contexts/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { AdminSidebar } from '@/components/admin/sidebar';
import { AdminTopbar } from '@/components/admin/topbar';
import { useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * T536: Admin Layout
 *
 * Layout for admin portal with:
 * - Sidebar navigation
 * - Topbar with user info
 * - Protected routes (SUPER_ADMIN only)
 * - Responsive design
 */

const inter = Inter({ subsets: ['latin'] });

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();

  // 로그인 페이지는 ProtectedRoute 및 레이아웃 제외
  const isLoginPage = pathname === '/admin/login';

  if (isLoginPage) {
    return (
      <AuthProvider>
        {children}
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <ProtectedRoute requiredRole="SUPER_ADMIN">
        <div className={`${inter.className} min-h-screen bg-gray-50`}>
          {/* Sidebar */}
          <AdminSidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />

          {/* Main Content Area */}
          <div className={`transition-all duration-300 ${
            sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
          }`}>
            {/* Topbar */}
            <AdminTopbar />

            {/* Page Content */}
            <main className="p-6">
              {children}
            </main>
          </div>
        </div>
      </ProtectedRoute>
    </AuthProvider>
  );
}
