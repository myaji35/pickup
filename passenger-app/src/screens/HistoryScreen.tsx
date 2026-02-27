/**
 * HistoryScreen
 * 운행 히스토리 조회 화면
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
import { getMyTrips } from '../api/tripApi';
import { Trip } from '../types';

export const HistoryScreen: React.FC = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      setIsLoading(true);
      const data = await getMyTrips();
      // 완료되거나 취소된 운행만 표시 (히스토리)
      const historyTrips = data.filter(
        (trip) => trip.status === 'COMPLETED' || trip.status === 'CANCELLED'
      );
      setTrips(historyTrips);
    } catch (error: any) {
      Alert.alert(
        '조회 실패',
        error.response?.data?.message || '운행 히스토리를 불러올 수 없습니다.'
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

  const getFilteredTrips = () => {
    if (filter === 'all') {
      return trips;
    }
    return trips.filter((trip) =>
      filter === 'completed'
        ? trip.status === 'COMPLETED'
        : trip.status === 'CANCELLED'
    );
  };

  const renderTripItem = ({ item }: { item: Trip }) => {
    const scheduleDate = new Date(item.scheduledStart);
    const dateStr = scheduleDate.toLocaleDateString('ko-KR', {
      year: 'numeric',
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

    const isCompleted = item.status === 'COMPLETED';
    const isCancelled = item.status === 'CANCELLED';

    // 실제 탑승/하차 시간
    const actualStartTime = item.actualStart
      ? new Date(item.actualStart).toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : null;

    const actualEndTime = item.actualEnd
      ? new Date(item.actualEnd).toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : null;

    return (
      <View
        style={[
          styles.tripCard,
          isCancelled && styles.tripCardCancelled,
        ]}
      >
        <View style={styles.tripHeader}>
          <View>
            <Text style={styles.tripType}>{typeLabel}</Text>
            <Text style={styles.tripDate}>{dateStr}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: isCompleted ? '#16a34a' : '#dc2626',
              },
            ]}
          >
            <Text style={styles.statusText}>
              {isCompleted ? '완료' : '취소'}
            </Text>
          </View>
        </View>

        <View style={styles.tripBody}>
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>예정 시간</Text>
            <Text style={styles.timeValue}>{timeStr}</Text>
          </View>

          {isCompleted && actualStartTime && (
            <>
              <View style={styles.timeRow}>
                <Text style={styles.timeLabel}>탑승 시간</Text>
                <Text style={[styles.timeValue, styles.actualTime]}>
                  {actualStartTime}
                </Text>
              </View>

              {actualEndTime && (
                <View style={styles.timeRow}>
                  <Text style={styles.timeLabel}>하차 시간</Text>
                  <Text style={[styles.timeValue, styles.actualTime]}>
                    {actualEndTime}
                  </Text>
                </View>
              )}
            </>
          )}

          {isCancelled && (
            <View style={styles.cancelledNote}>
              <Text style={styles.cancelledText}>
                이 운행은 취소되었습니다
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const filteredTrips = getFilteredTrips();

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
        <Text style={styles.headerTitle}>운행 히스토리</Text>
        <Text style={styles.headerSubtitle}>
          총 {trips.length}건의 기록
        </Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text
            style={[
              styles.filterTabText,
              filter === 'all' && styles.filterTabTextActive,
            ]}
          >
            전체
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === 'completed' && styles.filterTabActive,
          ]}
          onPress={() => setFilter('completed')}
        >
          <Text
            style={[
              styles.filterTabText,
              filter === 'completed' && styles.filterTabTextActive,
            ]}
          >
            완료
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === 'cancelled' && styles.filterTabActive,
          ]}
          onPress={() => setFilter('cancelled')}
        >
          <Text
            style={[
              styles.filterTabText,
              filter === 'cancelled' && styles.filterTabTextActive,
            ]}
          >
            취소
          </Text>
        </TouchableOpacity>
      </View>

      {/* Trip List */}
      {filteredTrips.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>운행 기록이 없습니다</Text>
          <Text style={styles.emptySubText}>
            완료되거나 취소된 운행이 여기에 표시됩니다
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredTrips}
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
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#2563eb',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  filterTabTextActive: {
    color: '#fff',
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
  tripCardCancelled: {
    opacity: 0.7,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tripType: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  tripDate: {
    fontSize: 14,
    color: '#64748b',
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
  tripBody: {
    gap: 8,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  timeLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  actualTime: {
    color: '#2563eb',
  },
  cancelledNote: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
  },
  cancelledText: {
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    maxWidth: 280,
  },
});
