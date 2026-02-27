/**
 * TrackingScreen — Epic 8 (홈 탭)
 * 실시간 차량 위치 + ETA 카드
 * 10초 폴링 + ActionCable 구독 (WebSocket)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView, RefreshControl,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { getActiveTrip } from '../api/tripApi';
import { ActiveTrip } from '../types';

const SHUTTLE_TYPE_LABEL: Record<string, string> = {
  morning:   '등원',
  evening:   '하원',
  temporary: '임시',
};

export const TrackingScreen: React.FC = () => {
  const { user } = useAuth();
  const [trip, setTrip]           = useState<ActiveTrip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadActiveTrip = useCallback(async () => {
    try {
      const data = await getActiveTrip();
      setTrip(data);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('active trip 조회 실패:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActiveTrip();
    intervalRef.current = setInterval(loadActiveTrip, 10_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loadActiveTrip]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadActiveTrip();
    setRefreshing(false);
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!trip) {
    return (
      <ScrollView
        contentContainerStyle={styles.center}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🚌</Text>
          <Text style={styles.emptyTitle}>운행 중인 셔틀이 없습니다</Text>
          <Text style={styles.emptyDesc}>
            셔틀이 출발하면 실시간 위치와 예상 도착 시간이 표시됩니다.
          </Text>
          <TouchableOpacity style={styles.refreshBtn} onPress={loadActiveTrip}>
            <Text style={styles.refreshBtnText}>새로고침</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  const typeLabel = SHUTTLE_TYPE_LABEL[trip.shuttle_type] ?? '운행';
  const updateStr = lastUpdate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* 상단 상태 바 */}
      <View style={styles.topBar}>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
        <Text style={styles.updateText}>업데이트 {updateStr}</Text>
      </View>

      {/* ETA 메인 카드 */}
      <View style={styles.etaCard}>
        <Text style={styles.etaLabel}>
          {user?.passenger?.name ?? '승객'}님 · {typeLabel} 셔틀
        </Text>
        {trip.eta_minutes !== null ? (
          <>
            <Text style={styles.etaMinutes}>{trip.eta_minutes}분</Text>
            <Text style={styles.etaSubLabel}>예상 도착 시간</Text>
          </>
        ) : (
          <>
            <Text style={styles.etaMinutes}>--</Text>
            <Text style={styles.etaSubLabel}>도착 시간 계산 중...</Text>
          </>
        )}
      </View>

      {/* 지도 플레이스홀더 (카카오 지도 연동 시 대체) */}
      <View style={styles.mapCard}>
        <Text style={styles.mapTitle}>차량 위치</Text>
        {trip.current_lat && trip.current_lng ? (
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapCoords}>
              현재 위치{'\n'}
              위도 {trip.current_lat.toFixed(5)}{'\n'}
              경도 {trip.current_lng.toFixed(5)}
            </Text>
            {trip.current_speed !== null && (
              <Text style={styles.mapSpeed}>시속 {Math.round(trip.current_speed ?? 0)} km/h</Text>
            )}
          </View>
        ) : (
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapNoData}>GPS 신호 수신 중...</Text>
          </View>
        )}
      </View>

      {/* 운행 정보 */}
      <View style={styles.infoCard}>
        <Text style={styles.infoCardTitle}>운행 정보</Text>
        <InfoRow label="차량 번호" value={trip.vehicle.plate_number ?? '-'} />
        <InfoRow label="기사" value={trip.driver.name ?? '-'} />
        <InfoRow
          label="출발 시각"
          value={trip.started_at ? new Date(trip.started_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '-'}
        />
        <InfoRow label="GPS 갱신" value={updateStr} />
      </View>

      <Text style={styles.notice}>위치는 10초마다 자동으로 업데이트됩니다.</Text>
    </ScrollView>
  );
};

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#dcfce7', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#16a34a', marginRight: 5 },
  liveText: { fontSize: 12, fontWeight: '700', color: '#16a34a' },
  updateText: { fontSize: 12, color: '#94a3b8' },
  etaCard: {
    backgroundColor: '#2563eb', margin: 16, borderRadius: 16,
    padding: 24, alignItems: 'center',
  },
  etaLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 8 },
  etaMinutes: { color: '#fff', fontSize: 56, fontWeight: 'bold', lineHeight: 64 },
  etaSubLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 },
  mapCard: {
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12,
    borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#e2e8f0',
  },
  mapTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  mapPlaceholder: {
    backgroundColor: '#f8fafc', borderRadius: 10, padding: 20, alignItems: 'center',
    borderWidth: 1, borderColor: '#e2e8f0', minHeight: 120, justifyContent: 'center',
  },
  mapCoords: { fontSize: 13, color: '#475569', textAlign: 'center', lineHeight: 22 },
  mapSpeed: { marginTop: 8, fontSize: 14, fontWeight: '600', color: '#2563eb' },
  mapNoData: { fontSize: 14, color: '#94a3b8' },
  infoCard: {
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12,
    borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#e2e8f0',
  },
  infoCardTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  infoLabel: { fontSize: 14, color: '#64748b' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  notice: { textAlign: 'center', color: '#94a3b8', fontSize: 12, padding: 16 },
  emptyCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 32, alignItems: 'center',
    borderWidth: 1, borderColor: '#e2e8f0', maxWidth: 320,
  },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 8, textAlign: 'center' },
  emptyDesc: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  refreshBtn: { backgroundColor: '#2563eb', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  refreshBtnText: { color: '#fff', fontWeight: '600' },
});
