import apiClient from './client';
import { ApiResponse, AuthTokens, User } from '../types';

export const login = async (email: string, password: string): Promise<ApiResponse<AuthTokens>> => {
  const res = await apiClient.post<ApiResponse<AuthTokens>>('/auth/login', { email, password });
  return res.data;
};

export const getCurrentUser = async (): Promise<ApiResponse<{ user: User }>> => {
  const res = await apiClient.get<ApiResponse<{ user: User }>>('/auth/me');
  return res.data;
};

export const logout = async (): Promise<void> => {
  await apiClient.delete('/auth/logout').catch(() => {});
};
