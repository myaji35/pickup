'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Auth Context Provider — Rails API 연동
 * Rails JWT: localStorage 'rails_access_token'
 */

const RAILS_BASE = process.env.NEXT_PUBLIC_RAILS_API_URL || 'http://localhost:3001/api/v1';

export interface User {
  id: string | number;
  email: string;
  name: string;
  role: string;
  institutionId?: string | number | null;
}

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

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = localStorage.getItem('rails_access_token');
      if (!token) return;
      const res = await fetch(`${RAILS_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        const u = json.data;
        setUser({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role?.toUpperCase(),
          institutionId: u.institution_id ?? null,
        });
      } else {
        localStorage.removeItem('rails_access_token');
      }
    } catch {
      localStorage.removeItem('rails_access_token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const res = await fetch(`${RAILS_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || '로그인에 실패했습니다.');
    const { access_token, user: u } = json.data;
    localStorage.setItem('rails_access_token', access_token);
    setUser({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role?.toUpperCase(),
      institutionId: u.institution_id ?? null,
    });
  };

  const logout = () => {
    localStorage.removeItem('rails_access_token');
    setUser(null);
    router.push('/admin/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
        isSuperAdmin: user?.role === 'SUPER_ADMIN',
        isInstitutionAdmin: user?.role === 'INSTITUTION_ADMIN',
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
