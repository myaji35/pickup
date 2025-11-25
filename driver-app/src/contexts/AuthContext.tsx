/**
 * Auth Context (Phase 12.3)
 *
 * 전역 인증 상태 관리
 * - 로그인/로그아웃
 * - 토큰 저장/삭제
 * - 사용자 정보 관리
 */

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

/**
 * Auth Provider Component
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * 앱 시작 시 저장된 토큰으로 자동 로그인 시도
   */
  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (token) {
        // 토큰이 있으면 사용자 정보 조회
        const response = await authApi.getCurrentUser();
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Failed to load stored auth:', error);
      // 토큰이 만료되었거나 유효하지 않으면 삭제
      await SecureStore.deleteItemAsync('auth_token');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 로그인
   */
  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password);

      if (response.success) {
        // 토큰 저장
        await SecureStore.setItemAsync('auth_token', response.data.access_token);

        // 사용자 정보 설정
        setUser(response.data.user);
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(
        error.response?.data?.message || 'Login failed. Please try again.'
      );
    }
  };

  /**
   * 로그아웃
   */
  const logout = async () => {
    try {
      // 토큰 삭제
      await SecureStore.deleteItemAsync('auth_token');

      // 사용자 정보 초기화
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Auth Hook
 */
export const useAuth = (): AuthContextData => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
