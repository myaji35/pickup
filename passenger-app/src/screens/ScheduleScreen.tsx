/**
 * ScheduleScreen
 * 승객 운행 스케줄 조회 화면
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { getMyTrips } from '../api/tripApi';
import { Trip } from '../types';

export const ScheduleScreen: React.FC = () => {
  const { logout, user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      setIsLoading(true);
      const data = await getMyTrips();
      setTrips(data);
    } catch (error: any) {
      Alert.alert(
        '조회 실패',
        error.response?.data?.message || '운행 스케줄을 불러올 수 없습니다.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTrips();
    setRefreshing(false);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      Alert.alert('로그아웃 실패', '다시 시도해주세요.');
    }
  };

  const renderTripItem = ({ item }: { item: Trip }) => {
    const scheduleDate = new Date(item.scheduledStart);
    const dateStr = scheduleDate.toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
    const timeStr = scheduleDate.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const typeLabel =
      item.type === 'MORNING' ? '등원' : item.type === 'EVENING' ? '하원' : '임시';
    const statusLabel =
      item.status === 'SCHEDULED'
        ? '예정'
        : item.status === 'IN_PROGRESS'
        ? '운행중'
        : item.status === 'COMPLETED'
        ? '완료'
        : '취소';

    const statusColor =
      item.status === 'SCHEDULED'
        ? '#2563eb'
        : item.status === 'IN_PROGRESS'
        ? '#16a34a'
        : item.status === 'COMPLETED'
        ? '#64748b'
        : '#dc2626';

    return (
      <View style={styles.tripCard}>
        <View style={styles.tripHeader}>
          <Text style={styles.tripType}>{typeLabel}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
        </View>

        <Text style={styles.tripDate}>{dateStr}</Text>
        <Text style={styles.tripTime}>{timeStr}</Text>

        {item.status === 'IN_PROGRESS' && item.actualStart && (
          <Text style={styles.inProgressText}>
            운행 시작: {new Date(item.actualStart).toLocaleTimeString('ko-KR')}
          </Text>
        )}

        {item.status === 'COMPLETED' && item.actualEnd && (
          <Text style={styles.completedText}>
            완료: {new Date(item.actualEnd).toLocaleTimeString('ko-KR')}
          </Text>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>내 운행 스케줄</Text>
          <Text style={styles.headerSubtitle}>{user?.name || '승객'}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>
      </View>

      {/* Trip List */}
      {trips.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>예정된 운행이 없습니다.</Text>
        </View>
      ) : (
        <FlatList
          data={trips}
          renderItem={renderTripItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  tripCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tripType: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  tripDate: {
    fontSize: 16,
    color: '#475569',
    marginBottom: 4,
  },
  tripTime: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2563eb',
  },
  inProgressText: {
    marginTop: 12,
    fontSize: 14,
    color: '#16a34a',
  },
  completedText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
