/**
 * NotificationsScreen — Epic 8 (알림 센터 탭)
 * 로컬에 쌓인 알림 이력 표시 (FCM 수신 이력)
 * Phase 1: 정적 표시 (실제 FCM 연동 시 교체)
 */

import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

interface NotifItem {
  id: string;
  title: string;
  body: string;
  time: string;
  type: 'board' | 'alight' | 'start' | 'cancel';
}

const MOCK_NOTIFS: NotifItem[] = [
  { id: '1', title: '셔틀 출발', body: '오늘 등원 셔틀이 출발했습니다.', time: '오전 7:32', type: 'start' },
  { id: '2', title: '탑승 확인', body: '김민수님이 셔틀에 탑승했습니다.', time: '오전 7:45', type: 'board' },
  { id: '3', title: '하차 확인', body: '김민수님이 안전하게 하차했습니다.', time: '오전 8:20', type: 'alight' },
];

const TYPE_ICON: Record<string, string> = {
  start: '🚌', board: '✅', alight: '🏠', cancel: '❌',
};

const TYPE_COLOR: Record<string, string> = {
  start: '#2563eb', board: '#16a34a', alight: '#7c3aed', cancel: '#dc2626',
};

export const NotificationsScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>알림 센터</Text>
      </View>

      {MOCK_NOTIFS.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>받은 알림이 없습니다.</Text>
        </View>
      ) : (
        <FlatList
          data={MOCK_NOTIFS}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.card, { borderLeftColor: TYPE_COLOR[item.type] }]}>
              <Text style={styles.cardIcon}>{TYPE_ICON[item.type]}</Text>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardBody}>{item.body}</Text>
              </View>
              <Text style={styles.cardTime}>{item.time}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: {
    backgroundColor: '#fff', padding: 20, paddingTop: 60,
    borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
  list: { padding: 16, gap: 10 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#e2e8f0', borderLeftWidth: 4,
  },
  cardIcon: { fontSize: 22, marginRight: 12 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b', marginBottom: 2 },
  cardBody: { fontSize: 13, color: '#64748b' },
  cardTime: { fontSize: 12, color: '#94a3b8', marginLeft: 8 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#94a3b8' },
});
