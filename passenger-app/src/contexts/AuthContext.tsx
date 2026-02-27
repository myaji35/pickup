/**
 * AuthContext — Epic 8
 * Rails JWT 인증 (access_token / refresh_token)
 */

import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { apiClient } from '../api/client';
import { login as apiLogin, logout as apiLogout, register as apiRegister } from '../api/authApi';
import { User } from '../types';
import { setupNotificationHandler, registerPushToken } from '../services/notificationService';

interface RegisterParams {
  email: string;
  password: string;
  name: string;
  invite_code: string;
  relationship?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (params: RegisterParams) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const cleanup = setupNotificationHandler();
    checkAuthStatus();
    return () => { if (typeof cleanup === 'function') cleanup(); };
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      const userJson = await SecureStore.getItemAsync('user_data');
      if (token && userJson) {
        setUser(JSON.parse(userJson));
      }
    } catch (error) {
      console.error('인증 상태 확인 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveTokens = async (accessToken: string, refreshToken: string, userData: User) => {
    await SecureStore.setItemAsync('access_token', accessToken);
    await SecureStore.setItemAsync('refresh_token', refreshToken);
    await SecureStore.setItemAsync('user_data', JSON.stringify(userData));
    setUser(userData);
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiLogin(email, password);
      await saveTokens(response.access_token, response.refresh_token, response.user);
      // 로그인 성공 후 FCM 토큰 등록 (백그라운드)
      registerPushToken().catch(() => {});
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (params: RegisterParams) => {
    setIsLoading(true);
    try {
      const response = await apiRegister(params);
      await saveTokens(response.access_token, response.refresh_token, response.user);
      // 회원가입 후 FCM 토큰 등록 (백그라운드)
      registerPushToken().catch(() => {});
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await apiLogout();
    } catch {
      // 서버 오류여도 로컬은 클리어
    } finally {
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
      await SecureStore.deleteItemAsync('user_data');
      setUser(null);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
