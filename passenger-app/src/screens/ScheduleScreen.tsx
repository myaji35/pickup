/**
 * ScheduleScreen — Epic 8 (일정 탭)
 * 이번 주 + 다음 주 운행 일정 + 당일 취소
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { getMyTrips, cancelTrip } from '../api/tripApi';
import { Trip } from '../types';

const TYPE_LABEL: Record<string, string>   = { morning: '등원', evening: '하원', temporary: '임시' };
const STATUS_LABEL: Record<string, string> = { scheduled: '예정', in_progress: '운행중', completed: '완료', cancelled: '취소' };
const STATUS_COLOR: Record<string, string> = {
  scheduled:   '#2563eb',
  in_progress: '#16a34a',
  completed:   '#64748b',
  cancelled:   '#dc2626',
};

export const ScheduleScreen: React.FC = () => {
  const [trips, setTrips]       = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTrips = async () => {
    try {
      const data = await getMyTrips();
      setTrips(data);
    } catch (err: any) {
      Alert.alert('오류', err.response?.data?.message || '일정을 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadTrips(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTrips();
    setRefreshing(false);
  }, []);

  const handleCancel = (trip: Trip) => {
    Alert.alert(
      '탑승 취소',
      `${trip.trip_date} ${TYPE_LABEL[trip.shuttle_type]} 셔틀을 취소하시겠습니까?`,
      [
        { text: '닫기', style: 'cancel' },
        {
          text: '취소 확인',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelTrip(trip.id, '보호자 취소');
              Alert.alert('완료', '취소 요청이 처리되었습니다.');
              loadTrips();
            } catch (err: any) {
              Alert.alert('오류', err.response?.data?.message || '취소 처리에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Trip }) => {
    const date = new Date(item.trip_date + 'T00:00:00');
    const dateStr = date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });

    return (
      <View style={[styles.card, item.cancelled && styles.cardCancelled]}>
        <View style={styles.cardTop}>
          <Text style={styles.cardType}>{TYPE_LABEL[item.shuttle_type]} 셔틀</Text>
          <View style={[styles.badge, { backgroundColor: STATUS_COLOR[item.status] }]}>
            <Text style={styles.badgeText}>
              {item.cancelled ? '취소됨' : STATUS_LABEL[item.status]}
            </Text>
          </View>
        </View>

        <Text style={styles.cardDate}>{dateStr}</Text>

        {item.driver.name && (
          <Text style={styles.cardSub}>기사: {item.driver.name}</Text>
        )}
        {item.vehicle.plate_number && (
          <Text style={styles.cardSub}>차량: {item.vehicle.plate_number}</Text>
        )}
        {item.started_at && (
          <Text style={styles.cardSub}>
            출발: {new Date(item.started_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}

        {item.status === 'scheduled' && !item.cancelled && (
          <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(item)}>
            <Text style={styles.cancelBtnText}>당일 취소 요청</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>운행 일정</Text>
        <Text style={styles.headerSub}>이번 주 · 다음 주</Text>
      </View>

      <FlatList
        data={trips}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>예정된 운행이 없습니다.</Text>
          </View>
        }
      />
    </View>
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
  headerSub: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  cardCancelled: { opacity: 0.55 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardType: { fontSize: 17, fontWeight: '700', color: '#1e293b' },
  badge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  cardDate: { fontSize: 15, color: '#475569', marginBottom: 6 },
  cardSub: { fontSize: 13, color: '#64748b', marginTop: 2 },
  cancelBtn: {
    marginTop: 12, borderWidth: 1, borderColor: '#dc2626',
    borderRadius: 8, padding: 10, alignItems: 'center',
  },
  cancelBtnText: { color: '#dc2626', fontSize: 14, fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 15, color: '#94a3b8' },
});
