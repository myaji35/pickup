import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { User } from '../types';
import * as authApi from '../api/authApi';

interface AuthContextData {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (token) {
        const res = await authApi.getCurrentUser();
        if (res.success) setUser(res.data.user);
      }
    } catch {
      await clearTokens();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    if (!res.success) throw new Error(res.error || '로그인 실패');

    // Rails 응답: { access_token, refresh_token, user }
    await SecureStore.setItemAsync('access_token', res.data.access_token);
    await SecureStore.setItemAsync('refresh_token', res.data.refresh_token);
    setUser(res.data.user);
  };

  const logout = async () => {
    await authApi.logout();
    await clearTokens();
    setUser(null);
  };

  const clearTokens = async () => {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextData => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
