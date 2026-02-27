import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';

// Rails API: port 3001 (개발), 실기기는 로컬 IP로 변경 필요
export const API_BASE_URL = __DEV__
  ? 'http://localhost:3001/api/v1'
  : 'https://api.pickup.kr/api/v1';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request: Access Token 자동 첨부 ──────────────────────────────
apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response: 401 시 Refresh Token으로 재발급 ───────────────────
let isRefreshing = false;
let pendingQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = [];

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as any;

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return apiClient(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await SecureStore.getItemAsync('refresh_token');
        if (!refreshToken) throw new Error('no refresh token');

        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const newAccess = data.data.access_token;
        await SecureStore.setItemAsync('access_token', newAccess);
        pendingQueue.forEach((p) => p.resolve(newAccess));
        pendingQueue = [];

        original.headers.Authorization = `Bearer ${newAccess}`;
        return apiClient(original);
      } catch (e) {
        pendingQueue.forEach((p) => p.reject(e));
        pendingQueue = [];
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
