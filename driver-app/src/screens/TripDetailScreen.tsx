import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { TripDetail, TripPassenger } from '../types';
import * as tripApi from '../api/tripApi';
import { watchLocation, getCurrentLocation } from '../utils/location';

const CHECK_IN_STATUS_LABEL: Record<string, string> = {
  pending:  '대기',
  boarded:  '탑승',
  alighted: '하차',
  absent:   '결석',
};

const CHECK_IN_STATUS_COLOR: Record<string, string> = {
  pending:  '#8E8E93',
  boarded:  '#34C759',
  alighted: '#007AFF',
  absent:   '#FF3B30',
};

export const TripDetailScreen: React.FC<{ route: any; navigation: any }> = ({
  route, navigation,
}) => {
  const { tripId } = route.params as { tripId: number };
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const stopWatchRef = useRef<(() => void) | null>(null);

  const loadTrip = useCallback(async () => {
    try {
      const res = await tripApi.getTripDetail(tripId);
      if (res.success) setTrip(res.data);
    } catch (e: any) {
      Alert.alert('오류', e?.response?.data?.error || '운행 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    loadTrip();
    return () => stopWatchRef.current?.();
  }, [loadTrip]);

  // 운행 중이면 GPS 감시 시작
  useEffect(() => {
    if (trip?.status === 'in_progress') {
      startGpsWatch(trip.id);
    } else {
      stopWatchRef.current?.();
      stopWatchRef.current = null;
    }
  }, [trip?.status]);

  const startGpsWatch = (id: number) => {
    if (stopWatchRef.current) return; // 이미 실행 중
    const stop = watchLocation(async ({ lat, lng, heading, speed }) => {
      try {
        await tripApi.updateLocation(id, lat, lng, heading, speed);
      } catch (e) {
        console.warn('GPS 업데이트 실패:', e);
      }
    });
    stopWatchRef.current = stop;
  };

  const handleStart = async () => {
    if (!trip) return;
    setActionLoading(true);
    try {
      const loc = await getCurrentLocation();
      const res = await tripApi.startTrip(trip.id);
      if (res.success) {
        if (loc) await tripApi.updateLocation(trip.id, loc.lat, loc.lng, loc.heading, loc.speed);
        await loadTrip();
        Alert.alert('운행 시작', '운행이 시작되었습니다. GPS 전송을 시작합니다.');
      }
    } catch (e: any) {
      Alert.alert('오류', e?.response?.data?.error || '운행 시작에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnd = () => {
    Alert.alert('운행 종료', '운행을 종료하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '종료', onPress: doEnd, style: 'destructive' },
    ]);
  };

  const doEnd = async () => {
    if (!trip) return;
    setActionLoading(true);
    try {
      const res = await tripApi.endTrip(trip.id);
      if (res.success) {
        stopWatchRef.current?.();
        stopWatchRef.current = null;
        await loadTrip();
        Alert.alert('운행 완료', '운행이 종료되었습니다.');
      }
    } catch (e: any) {
      Alert.alert('오류', e?.response?.data?.error || '운행 종료에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !trip) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const shuttleLabel = { morning: '등원', evening: '하원', temporary: '임시' }[trip.shuttle_type];
  const boardedCount = trip.passengers.filter((p) => p.status === 'boarded').length;

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{shuttleLabel} 운행</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {/* 운행 정보 카드 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>운행 정보</Text>
          <Row label="날짜" value={trip.trip_date} />
          <Row label="차량" value={trip.vehicle?.plate_number ?? '-'} />
          <Row label="승객" value={`${trip.passengers_count}명 (탑승 ${boardedCount}명)`} />
          {trip.current_lat && (
            <Row
              label="현재 위치"
              value={`${Number(trip.current_lat).toFixed(5)}, ${Number(trip.current_lng).toFixed(5)}`}
            />
          )}
        </View>

        {/* 승객 목록 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>승객 목록</Text>
          {trip.passengers.length === 0 ? (
            <Text style={styles.emptyText}>배정된 승객이 없습니다.</Text>
          ) : (
            trip.passengers.map((p) => (
              <PassengerRow
                key={p.check_in_id}
                passenger={p}
                tripStatus={trip.status}
                onUpdated={loadTrip}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* 하단 액션 버튼 */}
      {trip.status === 'scheduled' && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.startBtn]}
            onPress={handleStart}
            disabled={actionLoading}
          >
            {actionLoading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.actionBtnText}>운행 시작</Text>}
          </TouchableOpacity>
        </View>
      )}

      {trip.status === 'in_progress' && (
        <View style={styles.footer}>
          <View style={styles.gpsIndicator}>
            <View style={styles.gpsDot} />
            <Text style={styles.gpsText}>GPS 전송 중</Text>
          </View>
          <TouchableOpacity
            style={[styles.actionBtn, styles.endBtn]}
            onPress={handleEnd}
            disabled={actionLoading}
          >
            {actionLoading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.actionBtnText}>운행 종료</Text>}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// ─── 승객 행 (탑승/하차 버튼 포함) ────────────────────────────────
const PassengerRow: React.FC<{
  passenger: TripPassenger;
  tripStatus: string;
  onUpdated: () => void;
}> = ({ passenger, tripStatus, onUpdated }) => {
  const [loading, setLoading] = useState(false);

  const handle = async (action: 'board' | 'alight') => {
    setLoading(true);
    try {
      const { boardPassenger, alightPassenger } = await import('../api/checkinApi');
      const fn = action === 'board' ? boardPassenger : alightPassenger;
      await fn(passenger.check_in_id);
      await onUpdated();
    } catch (e: any) {
      Alert.alert('오류', e?.response?.data?.error || '처리에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={prStyles.row}>
      <View style={prStyles.info}>
        <Text style={prStyles.name}>{passenger.name}</Text>
        <Text style={prStyles.address} numberOfLines={1}>{passenger.pickup_address}</Text>
      </View>
      <View style={prStyles.right}>
        <View style={[prStyles.badge, { backgroundColor: CHECK_IN_STATUS_COLOR[passenger.status] }]}>
          <Text style={prStyles.badgeText}>{CHECK_IN_STATUS_LABEL[passenger.status]}</Text>
        </View>
        {tripStatus === 'in_progress' && (
          <>
            {passenger.status === 'pending' && (
              <TouchableOpacity
                style={[prStyles.btn, prStyles.boardBtn]}
                onPress={() => handle('board')}
                disabled={loading}
              >
                <Text style={prStyles.btnText}>탑승</Text>
              </TouchableOpacity>
            )}
            {passenger.status === 'boarded' && (
              <TouchableOpacity
                style={[prStyles.btn, prStyles.alightBtn]}
                onPress={() => handle('alight')}
                disabled={loading}
              >
                <Text style={prStyles.btnText}>하차</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </View>
  );
};

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F2F2F7' },
  center:       { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                  backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12,
                  borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  backBtn:      { padding: 4 },
  backText:     { fontSize: 16, color: '#007AFF' },
  headerTitle:  { fontSize: 17, fontWeight: '600', color: '#1C1C1E' },
  body:         { padding: 16, gap: 12 },
  card:         { backgroundColor: '#fff', borderRadius: 12, padding: 16,
                  shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardTitle:    { fontSize: 15, fontWeight: '600', color: '#1C1C1E', marginBottom: 12 },
  row:          { flexDirection: 'row', justifyContent: 'space-between',
                  paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  rowLabel:     { fontSize: 14, color: '#8E8E93' },
  rowValue:     { fontSize: 14, color: '#1C1C1E', fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
  emptyText:    { fontSize: 14, color: '#8E8E93', textAlign: 'center', paddingVertical: 16 },
  footer:       { backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderTopColor: '#E5E5EA',
                  flexDirection: 'row', alignItems: 'center', gap: 12 },
  gpsIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  gpsDot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: '#34C759' },
  gpsText:      { fontSize: 13, color: '#34C759', fontWeight: '500' },
  actionBtn:    { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  startBtn:     { backgroundColor: '#34C759' },
  endBtn:       { backgroundColor: '#FF3B30' },
  actionBtnText:{ fontSize: 16, fontWeight: '700', color: '#fff' },
});

const prStyles = StyleSheet.create({
  row:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
              paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  info:     { flex: 1, gap: 2 },
  name:     { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  address:  { fontSize: 12, color: '#8E8E93' },
  right:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText:{ fontSize: 11, fontWeight: '600', color: '#fff' },
  btn:      { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  boardBtn: { backgroundColor: '#34C759' },
  alightBtn:{ backgroundColor: '#007AFF' },
  btnText:  { fontSize: 13, fontWeight: '600', color: '#fff' },
});
