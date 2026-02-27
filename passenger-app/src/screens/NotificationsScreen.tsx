/**
 * NotificationsScreen — Epic 14
 * FCM 수신 이력 표시 (AsyncStorage 기반)
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  loadNotifications,
  clearNotifications,
  type StoredNotification,
} from '../services/notificationService';

const TYPE_CONFIG: Record<
  StoredNotification['type'],
  { label: string; color: string; icon: string }
> = {
  board:           { label: '탑승 확인',  color: '#16a34a', icon: '✅' },
  alight:          { label: '하차 확인',  color: '#7c3aed', icon: '🏠' },
  trip_started:    { label: '셔틀 출발',  color: '#2563eb', icon: '🚌' },
  eta_approaching: { label: '도착 예정',  color: '#ea580c', icon: '⏰' },
  dtc_alert:       { label: '차량 이상',  color: '#dc2626', icon: '⚠️' },
  other:           { label: '알림',       color: '#64748b', icon: '🔔' },
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);

  if (diffMin < 1)  return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;

  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24)   return `${diffH}시간 전`;

  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export const NotificationsScreen: React.FC = () => {
  const [notifications, setNotifications] = useState<StoredNotification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const items = await loadNotifications();
    setNotifications(items);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleClear = () => {
    Alert.alert(
      '알림 이력 삭제',
      '모든 알림 이력을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            await clearNotifications();
            setNotifications([]);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>알림 센터</Text>
        {notifications.length > 0 && (
          <TouchableOpacity onPress={handleClear}>
            <Text style={styles.clearBtn}>전체 삭제</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 알림 목록 */}
      {notifications.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={styles.emptyText}>받은 알림이 없습니다.</Text>
          <Text style={styles.emptySubText}>자녀 탑승·하차 시 알림이 여기에 표시됩니다.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#00A1E0" />
          }
          renderItem={({ item }) => {
            const config = TYPE_CONFIG[item.type];
            return (
              <View style={[styles.card, { borderLeftColor: config.color }]}>
                <Text style={styles.cardIcon}>{config.icon}</Text>
                <View style={styles.cardContent}>
                  <View style={styles.cardRow}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <View style={[styles.badge, { backgroundColor: config.color + '20' }]}>
                      <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardBody}>{item.body}</Text>
                </View>
                <Text style={styles.cardTime}>{formatTime(item.receivedAt)}</Text>
              </View>
            );
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
  clearBtn: { fontSize: 14, color: '#94a3b8', paddingBottom: 2 },
  list: { padding: 16, gap: 10 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderLeftWidth: 4,
  },
  cardIcon: { fontSize: 22, marginRight: 12, marginTop: 1 },
  cardContent: { flex: 1 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  cardBody: { fontSize: 13, color: '#64748b', lineHeight: 18 },
  cardTime: { fontSize: 12, color: '#94a3b8', marginLeft: 8, marginTop: 2, flexShrink: 0 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#475569' },
  emptySubText: { fontSize: 13, color: '#94a3b8', textAlign: 'center', paddingHorizontal: 40 },
});
