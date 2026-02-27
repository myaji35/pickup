/**
 * Auth API — Epic 8 (Rails JWT 기반)
 */

import { apiClient } from './client';
import { ApiResponse, AuthResponse } from '../types';

// 일반 로그인 (기존 driver 앱과 동일한 엔드포인트)
export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const res = await apiClient.post<ApiResponse<AuthResponse>>('/api/v1/auth/login', { email, password });
  return res.data.data;
};

// 보호자 회원가입 (초대 코드 기반)
export const register = async (params: {
  email: string;
  password: string;
  name: string;
  invite_code: string;
  relationship?: string;
}): Promise<AuthResponse> => {
  const res = await apiClient.post<ApiResponse<AuthResponse>>('/api/v1/guardian/auth/register', params);
  return res.data.data;
};

// 로그아웃
export const logout = async (): Promise<void> => {
  await apiClient.delete('/api/v1/auth/logout');
};

// FCM 토큰 등록
export const updateFcmToken = async (token: string): Promise<void> => {
  await apiClient.post('/api/v1/guardian/auth/fcm_token', { token });
};
