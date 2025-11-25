/**
 * Auth API (Phase 12.3)
 *
 * 인증 관련 API 호출 함수
 */

import apiClient from './client';
import { LoginRequest, LoginResponse } from '../types';

/**
 * POST /auth/login
 * 로그인
 */
export const login = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/auth/login', {
    email,
    password,
  });
  return response.data;
};

/**
 * GET /auth/me
 * 현재 사용자 정보 조회
 */
export const getCurrentUser = async () => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};
