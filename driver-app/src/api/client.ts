/**
 * API Client (Phase 12.3)
 *
 * Axios 기반 HTTP 클라이언트
 * 인증 토큰 자동 첨부 및 에러 핸들링
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';

// API Base URL (개발 환경 - localhost:3000)
// 실제 디바이스에서는 컴퓨터의 로컬 IP 사용 필요 (예: http://192.168.0.10:3000)
const API_BASE_URL = __DEV__
  ? 'http://localhost:3000' // 개발 환경
  : 'https://api.production.com'; // 프로덕션 환경

/**
 * Axios 인스턴스 생성
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor
 * 모든 요청에 인증 토큰 자동 첨부
 */
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Failed to get auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * 에러 핸들링 및 로깅
 */
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    if (error.response) {
      // 서버에서 응답을 받았지만 2xx 범위가 아닌 상태 코드
      console.error('API Error Response:', error.response.data);

      // 401 Unauthorized - 토큰 만료 또는 유효하지 않음
      if (error.response.status === 401) {
        // 로그아웃 처리 (토큰 삭제)
        await SecureStore.deleteItemAsync('auth_token');
        // 로그인 화면으로 리다이렉트는 AuthContext에서 처리
      }
    } else if (error.request) {
      // 요청이 전송되었지만 응답이 없음
      console.error('API No Response:', error.request);
    } else {
      // 요청 설정 중 오류 발생
      console.error('API Request Error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
