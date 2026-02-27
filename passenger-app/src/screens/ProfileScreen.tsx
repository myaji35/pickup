/**
 * ProfileScreen — Epic 8 (프로필 탭)
 * 보호자 정보 + 연결 승객 + 로그아웃
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../api/client';
import { ApiResponse, GuardianProfile } from '../types';

export const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<GuardianProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await apiClient.get<ApiResponse<GuardianProfile>>('/api/v1/guardian/profile');
      setProfile(res.data.data);
    } catch (err) {
      console.error('프로필 조회 실패:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: logout },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>프로필</Text>
      </View>

      {/* 사용자 정보 */}
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(profile?.name ?? user?.name ?? '?')[0].toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{profile?.name ?? user?.name}</Text>
        <Text style={styles.email}>{profile?.email ?? user?.email}</Text>
      </View>

      {/* 연결된 승객 */}
      {profile?.passengers && profile.passengers.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>연결된 승객</Text>
          {profile.passengers.map((p) => (
            <View key={p.id} style={styles.passengerCard}>
              <View>
                <Text style={styles.passengerName}>{p.name}</Text>
                <Text style={styles.passengerRel}>
                  {p.relationship === 'parent' ? '부모' : p.relationship === 'guardian' ? '보호자' : '기타'}
                </Text>
              </View>
              <View style={styles.inviteCodeBadge}>
                <Text style={styles.inviteCodeLabel}>초대 코드</Text>
                <Text style={styles.inviteCode}>{p.invite_code}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* 로그아웃 */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutBtnText}>로그아웃</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#fff', padding: 20, paddingTop: 60,
    borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
  card: {
    backgroundColor: '#fff', margin: 16, borderRadius: 14,
    padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0',
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#2563eb',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 30, fontWeight: 'bold', color: '#fff' },
  name: { fontSize: 20, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
  email: { fontSize: 14, color: '#64748b' },
  section: { marginHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#374151', marginBottom: 10 },
  passengerCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  passengerName: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  passengerRel: { fontSize: 12, color: '#64748b', marginTop: 2 },
  inviteCodeBadge: { alignItems: 'flex-end' },
  inviteCodeLabel: { fontSize: 11, color: '#94a3b8', marginBottom: 2 },
  inviteCode: { fontSize: 14, fontWeight: '700', color: '#2563eb', letterSpacing: 1 },
  logoutBtn: {
    marginHorizontal: 16, marginTop: 8, marginBottom: 40,
    borderRadius: 12, padding: 16, alignItems: 'center',
    borderWidth: 1, borderColor: '#dc2626',
  },
  logoutBtnText: { color: '#dc2626', fontSize: 15, fontWeight: '700' },
});
