/**
 * FCM 푸시 알림 서비스 — Passenger App (보호자)
 *
 * expo-notifications를 통해:
 * 1. 알림 권한 요청
 * 2. 푸시 토큰 획득 → 서버 등록
 * 3. 수신된 알림을 AsyncStorage에 이력으로 저장
 * 4. 포그라운드 알림 수신 핸들러 등록
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateFcmToken } from '../api/authApi';

// expo-notifications는 선택적 의존성
let Notifications: typeof import('expo-notifications') | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Notifications = require('expo-notifications');
} catch {
  // 패키지 미설치 시 무시
}

export interface StoredNotification {
  id: string;
  title: string;
  body: string;
  type: 'board' | 'alight' | 'trip_started' | 'eta_approaching' | 'dtc_alert' | 'other';
  receivedAt: string; // ISO8601
}

const STORAGE_KEY = 'passenger_notifications';
const MAX_STORED = 50;

// ─────────────────────────────────────────────────
// 핸들러 설정
// ─────────────────────────────────────────────────

/**
 * 포그라운드 알림 핸들러 + 수신 리스너 설정
 * AuthProvider mount 시 호출합니다.
 */
export function setupNotificationHandler(): (() => void) | void {
  if (!Notifications) return;

  // 포그라운드에서도 배너 표시
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  // 수신된 알림을 로컬 이력에 저장
  const subscription = Notifications.addNotificationReceivedListener((notification) => {
    saveNotification(notification).catch(() => {});
  });

  // cleanup 함수 반환
  return () => subscription.remove();
}

// ─────────────────────────────────────────────────
// 토큰 등록
// ─────────────────────────────────────────────────

/**
 * 알림 권한 요청 → 토큰 획득 → 서버 등록
 * 로그인/회원가입 성공 직후 호출합니다.
 */
export async function registerPushToken(): Promise<string | null> {
  if (!Notifications) {
    console.log('[NotificationService] expo-notifications 미설치 — 스킵');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[NotificationService] 알림 권한 거부됨');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('passenger', {
        name: '자녀 알림',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#00A1E0',
        showBadge: true,
        sound: 'default',
      });
    }

    // guardian 전용 FCM 토큰 등록 엔드포인트
    await updateFcmToken(token);

    console.log('[NotificationService] 토큰 등록 성공:', token.substring(0, 20) + '...');
    return token;
  } catch (error) {
    console.warn('[NotificationService] 토큰 등록 실패:', error);
    return null;
  }
}

// ─────────────────────────────────────────────────
// 알림 이력 관리
// ─────────────────────────────────────────────────

/**
 * 수신된 알림을 AsyncStorage에 저장 (최대 50개)
 */
async function saveNotification(
  notification: import('expo-notifications').Notification
): Promise<void> {
  const content = notification.request.content;
  const data = (content.data ?? {}) as Record<string, unknown>;

  const item: StoredNotification = {
    id: notification.request.identifier,
    title: content.title ?? 'Pickup',
    body: content.body ?? '',
    type: resolveType(data.notification_type as string | undefined),
    receivedAt: new Date().toISOString(),
  };

  const existing = await loadNotifications();
  const updated = [item, ...existing].slice(0, MAX_STORED);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

/**
 * 저장된 알림 이력 로드
 */
export async function loadNotifications(): Promise<StoredNotification[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredNotification[]) : [];
  } catch {
    return [];
  }
}

/**
 * 알림 이력 전체 삭제
 */
export async function clearNotifications(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

// ─────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────

function resolveType(raw: string | undefined): StoredNotification['type'] {
  switch (raw) {
    case 'boarded':       return 'board';
    case 'alighted':      return 'alight';
    case 'trip_started':  return 'trip_started';
    case 'eta_approaching': return 'eta_approaching';
    case 'dtc_alert':     return 'dtc_alert';
    default:              return 'other';
  }
}
