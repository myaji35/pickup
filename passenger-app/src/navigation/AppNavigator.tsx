/**
 * AppNavigator — Epic 8
 * 탭 4개: 홈(추적) / 일정 / 알림 / 프로필
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Text } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { LoginScreen }         from '../screens/LoginScreen';
import { TrackingScreen }      from '../screens/TrackingScreen';
import { ScheduleScreen }      from '../screens/ScheduleScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { ProfileScreen }       from '../screens/ProfileScreen';

export type RootStackParamList = {
  Login: undefined;
  Main:  undefined;
};

export type MainTabParamList = {
  Tracking:      undefined;
  Schedule:      undefined;
  Notifications: undefined;
  Profile:       undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab   = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<string, string> = {
  Tracking:      '🚌',
  Schedule:      '📅',
  Notifications: '🔔',
  Profile:       '👤',
};

const MainTabs: React.FC = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor:   '#2563eb',
      tabBarInactiveTintColor: '#94a3b8',
      tabBarStyle: {
        borderTopWidth: 1, borderTopColor: '#e2e8f0',
        paddingTop: 6, paddingBottom: 8, height: 62,
      },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      tabBarIcon: () => (
        <Text style={{ fontSize: 20 }}>{TAB_ICONS[route.name]}</Text>
      ),
    })}
  >
    <Tab.Screen name="Tracking"      component={TrackingScreen}      options={{ tabBarLabel: '홈' }} />
    <Tab.Screen name="Schedule"      component={ScheduleScreen}      options={{ tabBarLabel: '일정' }} />
    <Tab.Screen name="Notifications" component={NotificationsScreen} options={{ tabBarLabel: '알림' }} />
    <Tab.Screen name="Profile"       component={ProfileScreen}       options={{ tabBarLabel: '프로필' }} />
  </Tab.Navigator>
);

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated
          ? <Stack.Screen name="Main"  component={MainTabs} />
          : <Stack.Screen name="Login" component={LoginScreen} />
        }
      </Stack.Navigator>
    </NavigationContainer>
  );
};
