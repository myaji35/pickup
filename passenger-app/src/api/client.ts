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
      const token = await SecureStore.getItemAsync('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('토큰 가져오기 실패:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: 에러 처리
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // 401 Unauthorized: 토큰 만료 또는 유효하지 않음
      await SecureStore.deleteItemAsync('auth_token');
      // TODO: 로그인 화면으로 리다이렉트
    }
    return Promise.reject(error);
  }
);
