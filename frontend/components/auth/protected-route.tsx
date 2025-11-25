'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

/**
 * T524: Protected Route Component
 *
 * Wrapper component that protects routes requiring authentication
 * Redirects unauthenticated users to login page
 */

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'SUPER_ADMIN' | 'INSTITUTION_ADMIN' | 'DRIVER';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        // Redirect to login with return URL
        const returnUrl = window.location.pathname;
        router.push(`/admin/login?returnUrl=${encodeURIComponent(returnUrl)}`);
        return;
      }

      // Check role if specified
      if (requiredRole && user?.role !== requiredRole) {
        // Unauthorized - redirect to dashboard or show error
        router.push('/admin/dashboard');
      }
    }
  }, [loading, isAuthenticated, user, requiredRole, router]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Show nothing if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  // Check role authorization
  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">접근 권한이 없습니다</h1>
          <p className="mt-2 text-gray-600">이 페이지에 접근할 권한이 없습니다.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * T525: Role-based Route Guard
 *
 * HOC for protecting admin-only routes
 */
export function withSuperAdminGuard<P extends object>(
  Component: React.ComponentType<P>
) {
  return function SuperAdminGuardedComponent(props: P) {
    return (
      <ProtectedRoute requiredRole="SUPER_ADMIN">
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

export function withInstitutionAdminGuard<P extends object>(
  Component: React.ComponentType<P>
) {
  return function InstitutionAdminGuardedComponent(props: P) {
    return (
      <ProtectedRoute requiredRole="INSTITUTION_ADMIN">
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}
