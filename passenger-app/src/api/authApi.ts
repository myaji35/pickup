/**
 * Auth API
 * 인증 관련 API 함수들
 */

import { apiClient } from './client';
import { AuthResponse } from '../types';

/**
 * 로그인
 */
export const login = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/auth/login', {
    email,
    password,
  });
  return response.data;
};

/**
 * 로그아웃 (토큰 무효화)
 */
export const logout = async (): Promise<void> => {
  await apiClient.post('/auth/logout');
};
