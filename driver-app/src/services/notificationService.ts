/**
 * FCM 푸시 알림 서비스 — Driver App
 *
 * Expo Notifications를 통해 푸시 토큰을 획득하고
 * Rails 서버에 등록합니다.
 *
 * ※ expo-notifications 미설치 환경(CI/테스트)에서도
 *   동작하도록 try/catch로 보호합니다.
 */

import { Platform } from 'react-native';
import apiClient from '../api/client';

// expo-notifications는 선택적 의존성이므로 dynamic import
let Notifications: typeof import('expo-notifications') | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Notifications = require('expo-notifications');
} catch {
  // 패키지 미설치 시 무시
}

/**
 * 포그라운드 알림 핸들러 설정
 * 앱이 포그라운드 상태일 때도 배너 + 소리 표시
 */
export function setupNotificationHandler(): void {
  if (!Notifications) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * 알림 권한 요청 + 푸시 토큰 획득 → 서버 등록
 * 로그인 성공 직후 호출합니다.
 *
 * @returns 등록된 토큰 문자열 또는 null
 */
export async function registerPushToken(): Promise<string | null> {
  if (!Notifications) {
    console.log('[NotificationService] expo-notifications 미설치 — 스킵');
    return null;
  }

  try {
    // 1. 권한 확인/요청
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

    // 2. Expo 푸시 토큰 획득 (FCM/APNs 토큰으로 변환됨)
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    // 3. Android 알림 채널 설정
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Pickup 알림',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#00A1E0',
        showBadge: true,
      });
    }

    // 4. 서버에 FCM 토큰 등록
    await apiClient.post('/auth/fcm_token', {
      token,
      device_type: Platform.OS === 'ios' ? 'ios' : 'android',
    });

    console.log('[NotificationService] 토큰 등록 성공:', token.substring(0, 20) + '...');
    return token;
  } catch (error) {
    // FCM 등록 실패가 앱 사용을 막으면 안 됨
    console.warn('[NotificationService] 토큰 등록 실패:', error);
    return null;
  }
}

/**
 * 수신된 알림 페이로드에서 사람이 읽을 수 있는 메시지 추출
 */
export function parseNotificationBody(
  notification: import('expo-notifications').Notification
): { title: string; body: string } {
  const content = notification.request.content;
  return {
    title: content.title ?? 'Pickup',
    body: content.body ?? '',
  };
}
