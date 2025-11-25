/**
 * Driver App (Phase 12.3)
 *
 * 기사용 모바일 앱
 * - 로그인
 * - 오늘의 운행 목록
 * - 운행 시작/종료
 * - 승객 체크인/하차
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/contexts/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <AppNavigator />
    </AuthProvider>
  );
}
