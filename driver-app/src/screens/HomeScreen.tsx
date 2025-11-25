/**
 * Home Screen (Phase 12.3)
 *
 * 기사 홈 화면 - 오늘의 운행 목록 & 현재 진행 중인 운행
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { Trip, TripStatus, TripType } from '../types';
import * as tripApi from '../api/tripApi';

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inProgressTrip, setInProgressTrip] = useState<Trip | null>(null);

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      setLoading(true);

      // 오늘의 운행 목록 조회
      const tripsResponse = await tripApi.getTodayTrips();
      setTrips(tripsResponse.data);

      // 현재 진행 중인 운행 조회
      const inProgressResponse = await tripApi.getInProgressTrip();
      if (inProgressResponse.data) {
        setInProgressTrip(inProgressResponse.data.trip);
      }
    } catch (error: any) {
      Alert.alert(
        '데이터 로드 실패',
        error.response?.data?.message || '운행 목록을 불러오는데 실패했습니다.'
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTrips();
    setRefreshing(false);
  }, []);

  const handleLogout = () => {
    Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        onPress: logout,
        style: 'destructive',
      },
    ]);
  };

  const getTripTypeLabel = (type: TripType): string => {
    switch (type) {
      case TripType.MORNING:
        return '등원';
      case TripType.EVENING:
        return '하원';
      case TripType.TEMPORARY:
        return '임시';
      default:
        return type;
    }
  };

  const getTripStatusLabel = (status: TripStatus): string => {
    switch (status) {
      case TripStatus.SCHEDULED:
        return '예정';
      case TripStatus.IN_PROGRESS:
        return '진행 중';
      case TripStatus.COMPLETED:
        return '완료';
      case TripStatus.CANCELLED:
        return '취소';
      default:
        return status;
    }
  };

  const getTripStatusColor = (status: TripStatus): string => {
    switch (status) {
      case TripStatus.SCHEDULED:
        return '#007AFF';
      case TripStatus.IN_PROGRESS:
        return '#34C759';
      case TripStatus.COMPLETED:
        return '#8E8E93';
      case TripStatus.CANCELLED:
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const renderTripItem = ({ item }: { item: Trip }) => (
    <TouchableOpacity
      style={styles.tripCard}
      onPress={() => navigation.navigate('TripDetail', { tripId: item.id })}
    >
      <View style={styles.tripHeader}>
        <View style={styles.tripType}>
          <Text style={styles.tripTypeText}>{getTripTypeLabel(item.type)}</Text>
        </View>
        <View
          style={[
            styles.tripStatus,
            { backgroundColor: getTripStatusColor(item.status) },
          ]}
        >
          <Text style={styles.tripStatusText}>
            {getTripStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      <Text style={styles.tripTime}>
        출발 예정: {new Date(item.scheduledStart).toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>

      {item.actualStart && (
        <Text style={styles.tripTimeActual}>
          실제 출발: {new Date(item.actualStart).toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>안녕하세요</Text>
          <Text style={styles.userName}>{user?.name || '기사'} 님</Text>
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutButton}>로그아웃</Text>
        </TouchableOpacity>
      </View>

      {/* 진행 중인 운행 */}
      {inProgressTrip && (
        <View style={styles.inProgressCard}>
          <Text style={styles.inProgressTitle}>진행 중인 운행</Text>
          <TouchableOpacity
            style={styles.inProgressButton}
            onPress={() =>
              navigation.navigate('TripDetail', { tripId: inProgressTrip.id })
            }
          >
            <Text style={styles.inProgressButtonText}>
              {getTripTypeLabel(inProgressTrip.type)} 운행 관리하기
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 오늘의 운행 목록 */}
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>오늘의 운행</Text>
        <Text style={styles.listCount}>{trips.length}건</Text>
      </View>

      <FlatList
        data={trips}
        renderItem={renderTripItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>오늘 예정된 운행이 없습니다.</Text>
          </View>
        }
      />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  greeting: {
    fontSize: 14,
    color: '#666',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  logoutButton: {
    fontSize: 14,
    color: '#FF3B30',
  },
  inProgressCard: {
    backgroundColor: '#34C759',
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },
  inProgressTitle: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 12,
  },
  inProgressButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  inProgressButtonText: {
    color: '#34C759',
    fontSize: 16,
    fontWeight: '600',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  listCount: {
    fontSize: 14,
    color: '#666',
  },
  list: {
    padding: 16,
    paddingTop: 8,
  },
  tripCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tripType: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  tripTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  tripStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  tripStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  tripTime: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  tripTimeActual: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
