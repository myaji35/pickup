'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient, User } from '@/lib/api';
import { useRouter } from 'next/navigation';

/**
 * T522: Auth Context Provider
 *
 * Authentication state management using React Context
 * - User state
 * - Login/Logout actions
 * - Token management
 * - Auto token refresh
 */

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isInstitutionAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load user on mount
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        const currentUser = await apiClient.getCurrentUser();
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      // Clear invalid token
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.login({ email, password });
      setUser(response.data.user);
      // Redirect is handled by the login page
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    apiClient.logout();
    setUser(null);
    router.push('/admin/login');
  };

  const isAuthenticated = !!user;
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isInstitutionAdmin = user?.role === 'INSTITUTION_ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated,
        isSuperAdmin,
        isInstitutionAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
