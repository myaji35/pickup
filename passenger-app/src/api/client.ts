/**
 * API Client Configuration
 * Axios 인스턴스 설정 with 인증 토큰 자동 첨부
 */

import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// API Base URL 설정
// 개발 환경: localhost (iOS 시뮬레이터) 또는 컴퓨터 IP (실제 디바이스)
const API_BASE_URL = __DEV__
  ? 'http://localhost:3000' // iOS 시뮬레이터 / Android 에뮬레이터
  : 'https://api.production.com'; // Production URL (추후 설정)

// Axios 인스턴스 생성
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: 인증 토큰 자동 첨부
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('토큰 가져오기 실패:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: 401 시 refresh 토큰으로 재발급 시도
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await SecureStore.getItemAsync('refresh_token');
        if (refreshToken) {
          const res = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
            refresh_token: refreshToken,
          });
          const newToken = res.data.data.access_token;
          await SecureStore.setItemAsync('access_token', newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
      } catch {
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
      }
    }
    return Promise.reject(error);
  }
);
