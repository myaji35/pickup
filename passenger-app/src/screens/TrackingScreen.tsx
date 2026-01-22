/**
 * TrackingScreen
 * 실시간 차량 위치 추적 화면
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { getInProgressTrip } from '../api/tripApi';
import { Trip } from '../types';

export const TrackingScreen: React.FC = () => {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadTripData();

    // 10초마다 자동 새로고침
    const interval = setInterval(() => {
      loadTripData();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const loadTripData = async () => {
    try {
      const data = await getInProgressTrip();
      setTrip(data);
      setLastUpdate(new Date());
    } catch (error: any) {
      console.error('Failed to load trip:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await loadTripData();
  };

  if (isLoading && !trip) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>차량 정보를 불러오는 중...</Text>
      </View>
    );
  }

  if (!trip) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyIcon}>🚌</Text>
        <Text style={styles.emptyText}>현재 운행 중인 차량이 없습니다</Text>
        <Text style={styles.emptySubText}>
          운행이 시작되면 여기에서 실시간 위치를 확인할 수 있습니다
        </Text>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Text style={styles.refreshButtonText}>새로고침</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const typeLabel =
    trip.type === 'MORNING' ? '등원' : trip.type === 'EVENING' ? '하원' : '임시';

  const scheduleDate = new Date(trip.scheduledStart);
  const timeStr = scheduleDate.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const actualStartTime = trip.actualStart
    ? new Date(trip.actualStart).toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>차량 추적</Text>
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>운행 중</Text>
        </View>
      </View>

      {/* Trip Info Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{typeLabel} 셔틀</Text>
          <Text style={styles.scheduleTime}>예정: {timeStr}</Text>
        </View>

        {actualStartTime && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>출발 시간</Text>
            <Text style={styles.infoValue}>{actualStartTime}</Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>차량 번호</Text>
          <Text style={styles.infoValue}>...{trip.vehicleId.slice(-4)}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>마지막 업데이트</Text>
          <Text style={styles.infoValue}>
            {lastUpdate.toLocaleTimeString('ko-KR')}
          </Text>
        </View>
      </View>

      {/* Map Placeholder */}
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapIcon}>🗺️</Text>
        <Text style={styles.mapPlaceholderText}>
          실시간 지도 기능은 곧 추가될 예정입니다
        </Text>
        <Text style={styles.mapSubText}>
          차량의 현재 위치와 예상 도착 시간을 확인할 수 있습니다
        </Text>
      </View>

      {/* Refresh Button */}
      <TouchableOpacity
        style={styles.refreshButtonBottom}
        onPress={handleRefresh}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.refreshButtonBottomText}>새로고침</Text>
        )}
      </TouchableOpacity>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <Text style={styles.infoSectionTitle}>💡 안내</Text>
        <Text style={styles.infoSectionText}>
          • 차량 위치는 10초마다 자동으로 업데이트됩니다
        </Text>
        <Text style={styles.infoSectionText}>
          • 운행이 완료되면 이 화면이 자동으로 사라집니다
        </Text>
        <Text style={styles.infoSectionText}>
          • 위치 정보는 기사님의 앱에서 제공됩니다
        </Text>
      </View>
    </ScrollView>
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
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
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
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16a34a',
    marginRight: 6,
  },
  statusText: {
    color: '#16a34a',
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  scheduleTime: {
    fontSize: 14,
    color: '#64748b',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  mapPlaceholder: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  mapIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  mapPlaceholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
    marginBottom: 8,
  },
  mapSubText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  refreshButton: {
    marginTop: 20,
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  refreshButtonBottom: {
    backgroundColor: '#2563eb',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshButtonBottomText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  infoSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  infoSectionText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 8,
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
