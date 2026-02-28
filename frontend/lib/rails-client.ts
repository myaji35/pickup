/**
 * Rails API Client — Epic 7 Phase B
 * JWT Bearer 토큰 기반 (localStorage)
 * Rails 8.1.2 API-only 응답 형식: { success, data, message }
 */

const RAILS_BASE = process.env.NEXT_PUBLIC_RAILS_API_URL || 'http://localhost:3001/api/v1';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('rails_access_token');
}

async function railsRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${RAILS_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `HTTP ${res.status}`);
  }

  const json = await res.json();
  return json.data as T;
}

/** data 뿐 아니라 meta 등 전체 응답 객체를 반환 */
async function railsRequestRaw<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${RAILS_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const railsClient = {
  get:   <T>(path: string, params?: Record<string, string | number>) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
    return railsRequest<T>(`${path}${qs}`);
  },
  /** meta, data 모두 포함한 원본 응답 반환 */
  getRaw: <T>(path: string, params?: Record<string, string | number>) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
    return railsRequestRaw<T>(`${path}${qs}`);
  },
  patch: <T>(path: string, body?: unknown) =>
    railsRequest<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  post:   <T>(path: string, body?: unknown) =>
    railsRequest<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  delete: <T = void>(path: string) =>
    railsRequest<T>(path, { method: 'DELETE' }),
};
