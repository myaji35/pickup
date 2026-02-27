import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { Trip, ShuttleType, TripStatus } from '../types';
import * as tripApi from '../api/tripApi';

const SHUTTLE_LABEL: Record<ShuttleType, string> = {
  morning:   '🌅 등원',
  evening:   '🌆 하원',
  temporary: '🚌 임시',
};

const STATUS_COLOR: Record<TripStatus, string> = {
  scheduled:   '#007AFF',
  in_progress: '#34C759',
  completed:   '#8E8E93',
  cancelled:   '#FF3B30',
};

const STATUS_LABEL: Record<TripStatus, string> = {
  scheduled:   '대기 중',
  in_progress: '운행 중',
  completed:   '완료',
  cancelled:   '취소됨',
};

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTrips = useCallback(async () => {
    try {
      const res = await tripApi.getTodayTrips();
      if (res.success) setTrips(res.data);
    } catch (e: any) {
      Alert.alert('오류', e?.response?.data?.error || '운행 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadTrips(); }, [loadTrips]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadTrips();
  }, [loadTrips]);

  const handleTripPress = (trip: Trip) => {
    navigation.navigate('TripDetail', { tripId: trip.id });
  };

  const confirmLogout = () => {
    Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', onPress: logout, style: 'destructive' },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>안녕하세요,</Text>
          <Text style={styles.driverName}>{user?.name ?? '기사'} 님</Text>
        </View>
        <TouchableOpacity onPress={confirmLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>
      </View>

      {/* 오늘 날짜 */}
      <Text style={styles.dateLabel}>
        {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
      </Text>

      {/* 운행 목록 */}
      <FlatList
        data={trips}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={trips.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🚌</Text>
            <Text style={styles.emptyText}>오늘 배정된 운행이 없습니다.</Text>
          </View>
        }
        ListHeaderComponent={
          <Text style={styles.sectionTitle}>오늘의 운행 ({trips.length}건)</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.tripCard}
            onPress={() => handleTripPress(item)}
            activeOpacity={0.7}
          >
            <View style={styles.tripCardLeft}>
              <Text style={styles.shuttleLabel}>{SHUTTLE_LABEL[item.shuttle_type]}</Text>
              <Text style={styles.tripDate}>{item.trip_date}</Text>
              <Text style={styles.passengerCount}>승객 {item.passengers_count}명</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[item.status] }]}>
              <Text style={styles.statusText}>{STATUS_LABEL[item.status]}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#F2F2F7' },
  center:        { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                   backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  greeting:      { fontSize: 14, color: '#8E8E93' },
  driverName:    { fontSize: 22, fontWeight: '700', color: '#1C1C1E' },
  logoutBtn:     { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#F2F2F7', borderRadius: 8 },
  logoutText:    { fontSize: 14, color: '#FF3B30' },
  dateLabel:     { fontSize: 14, color: '#8E8E93', marginHorizontal: 20, marginTop: 16, marginBottom: 4 },
  sectionTitle:  { fontSize: 16, fontWeight: '600', color: '#1C1C1E', marginBottom: 8 },
  listContent:   { padding: 20, gap: 12 },
  emptyContainer:{ flex: 1, padding: 20 },
  empty:         { alignItems: 'center', paddingTop: 60 },
  emptyIcon:     { fontSize: 48, marginBottom: 12 },
  emptyText:     { fontSize: 16, color: '#8E8E93' },
  tripCard:      { backgroundColor: '#fff', borderRadius: 12, padding: 16,
                   flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                   shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
                   shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  tripCardLeft:  { gap: 4 },
  shuttleLabel:  { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  tripDate:      { fontSize: 13, color: '#8E8E93' },
  passengerCount:{ fontSize: 13, color: '#3C3C43' },
  statusBadge:   { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText:    { fontSize: 13, fontWeight: '600', color: '#fff' },
});
