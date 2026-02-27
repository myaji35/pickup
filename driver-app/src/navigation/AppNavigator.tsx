/**
 * App Navigator (Phase 12.4)
 *
 * 앱 내비게이션 설정
 * - 인증 상태에 따라 로그인/홈 화면 전환
 * - 운행 상세, 체크인 화면
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { LoginScreen } from '../screens/LoginScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { TripDetailScreen } from '../screens/TripDetailScreen';
import { CheckInScreen } from '../screens/CheckInScreen';
import { ObdSettingsScreen } from '../screens/ObdSettingsScreen';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

const Stack = createNativeStackNavigator();

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  // 초기 로딩 중
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {!isAuthenticated ? (
          // 로그인하지 않은 경우
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          // 로그인한 경우
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="TripDetail" component={TripDetailScreen} />
            <Stack.Screen name="CheckIn" component={CheckInScreen} />
            <Stack.Screen name="ObdSettings" component={ObdSettingsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
