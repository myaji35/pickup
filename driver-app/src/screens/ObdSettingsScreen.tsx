/**
 * OBD 설정 화면
 *
 * BLE 동글 스캔 / 연결 / 연결해제 + 실시간 데이터 미리보기
 */

import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useObd } from '../contexts/ObdContext';
import { ObdConnectionState } from '../services/obd2/ObdService';

const STATE_LABEL: Record<ObdConnectionState, string> = {
  disconnected:  '연결 안 됨',
  scanning:      'BLE 스캔 중...',
  connecting:    '연결 중...',
  initializing:  '초기화 중...',
  connected:     '연결됨',
  error:         '오류',
};

const STATE_COLOR: Record<ObdConnectionState, string> = {
  disconnected:  '#8E8E93',
  scanning:      '#FF9500',
  connecting:    '#FF9500',
  initializing:  '#FF9500',
  connected:     '#34C759',
  error:         '#FF3B30',
};

export const ObdSettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const {
    connectionState, isConnected, obdData,
    recentEvents, dtcCodes, lastError,
    connect, disconnect,
  } = useObd();

  const isBusy = ['scanning', 'connecting', 'initializing'].includes(connectionState);

  const handleConnect = async () => {
    try {
      await connect();
    } catch {
      Alert.alert('연결 오류', '다시 시도해주세요.');
    }
  };

  const handleDisconnect = () => {
    Alert.alert('연결 해제', 'OBD 동글 연결을 해제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '해제', onPress: disconnect, style: 'destructive' },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>OBD 동글 설정</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {/* 연결 상태 카드 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>연결 상태</Text>
          <View style={styles.stateRow}>
            <View style={[styles.stateDot, { backgroundColor: STATE_COLOR[connectionState] }]} />
            <Text style={[styles.stateText, { color: STATE_COLOR[connectionState] }]}>
              {STATE_LABEL[connectionState]}
            </Text>
            {isBusy && <ActivityIndicator size="small" color={STATE_COLOR[connectionState]} style={{ marginLeft: 8 }} />}
          </View>

          {lastError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{lastError}</Text>
            </View>
          )}

          <View style={styles.btnRow}>
            {!isConnected && !isBusy && (
              <TouchableOpacity style={[styles.btn, styles.connectBtn]} onPress={handleConnect}>
                <Text style={styles.btnText}>동글 연결</Text>
              </TouchableOpacity>
            )}
            {isBusy && (
              <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={disconnect}>
                <Text style={styles.btnText}>취소</Text>
              </TouchableOpacity>
            )}
            {isConnected && (
              <TouchableOpacity style={[styles.btn, styles.disconnectBtn]} onPress={handleDisconnect}>
                <Text style={styles.btnText}>연결 해제</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 실시간 데이터 카드 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>실시간 차량 데이터</Text>
          {!isConnected ? (
            <Text style={styles.emptyText}>OBD 동글을 먼저 연결하세요.</Text>
          ) : (
            <View style={styles.dataGrid}>
              <DataItem label="속도" value={obdData?.speed} unit="km/h" />
              <DataItem label="RPM" value={obdData?.rpm} unit="rpm" />
              <DataItem label="냉각수 온도" value={obdData?.coolantTemp} unit="°C" />
              <DataItem label="연료량" value={obdData?.fuelLevel?.toFixed(1)} unit="%" />
              <DataItem label="스로틀" value={obdData?.throttle?.toFixed(1)} unit="%" />
            </View>
          )}
        </View>

        {/* 안전 이벤트 카드 */}
        {recentEvents.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>최근 안전 이벤트</Text>
            {recentEvents.map((ev, idx) => (
              <View key={idx} style={styles.eventRow}>
                <Text style={styles.eventIcon}>{EVENT_ICON[ev.type]}</Text>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventLabel}>{EVENT_LABEL[ev.type]}</Text>
                  <Text style={styles.eventDetail}>{ev.speed} km/h · {Math.round(ev.rpm)} RPM</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* DTC 카드 */}
        {dtcCodes.length > 0 && (
          <View style={[styles.card, styles.dtcCard]}>
            <Text style={styles.cardTitle}>엔진 오류 코드 (DTC)</Text>
            {dtcCodes.map((code) => (
              <View key={code} style={styles.dtcRow}>
                <Text style={styles.dtcCode}>{code}</Text>
              </View>
            ))}
            <Text style={styles.dtcNote}>정비소 점검을 권장합니다.</Text>
          </View>
        )}

        {/* 안내 카드 */}
        <View style={[styles.card, styles.infoCard]}>
          <Text style={styles.infoTitle}>연결 방법</Text>
          <Text style={styles.infoText}>1. 차량 OBD-II 포트에 ELM327 BLE 동글을 꽂으세요.</Text>
          <Text style={styles.infoText}>2. 차량 시동을 켜세요.</Text>
          <Text style={styles.infoText}>3. "동글 연결" 버튼을 누르면 자동으로 검색합니다.</Text>
          <Text style={styles.infoText}>4. 연결 후 운행 화면에서 OBD 데이터가 자동 전송됩니다.</Text>
          <Text style={[styles.infoText, styles.infoNote]}>* 권장 동글: KONNWEI KW902 (BLE 4.0)</Text>
        </View>
      </ScrollView>
    </View>
  );
};

// ─── 서브 컴포넌트 ────────────────────────────────────────────────

const DataItem: React.FC<{ label: string; value: number | string | null | undefined; unit: string }> = ({
  label, value, unit,
}) => (
  <View style={styles.dataItem}>
    <Text style={styles.dataLabel}>{label}</Text>
    <Text style={styles.dataValue}>
      {value != null ? `${value} ${unit}` : '-'}
    </Text>
  </View>
);

const EVENT_LABEL: Record<string, string> = {
  harsh_accel: '급가속',
  harsh_brake: '급제동',
  speeding:    '과속',
  idling:      '공회전',
};

const EVENT_ICON: Record<string, string> = {
  harsh_accel: '⚡',
  harsh_brake: '🛑',
  speeding:    '🚨',
  idling:      '🔄',
};

// ─── 스타일 ───────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F2F2F7' },
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
  stateRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  stateDot:     { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  stateText:    { fontSize: 16, fontWeight: '600' },
  errorBox:     { backgroundColor: '#FFF2F2', borderRadius: 8, padding: 10, marginBottom: 12 },
  errorText:    { fontSize: 13, color: '#FF3B30' },
  btnRow:       { flexDirection: 'row', gap: 8 },
  btn:          { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  connectBtn:   { backgroundColor: '#34C759' },
  cancelBtn:    { backgroundColor: '#8E8E93' },
  disconnectBtn:{ backgroundColor: '#FF3B30' },
  btnText:      { fontSize: 15, fontWeight: '600', color: '#fff' },
  emptyText:    { fontSize: 14, color: '#8E8E93', textAlign: 'center', paddingVertical: 8 },
  dataGrid:     { gap: 8 },
  dataItem:     { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6,
                  borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  dataLabel:    { fontSize: 14, color: '#8E8E93' },
  dataValue:    { fontSize: 14, color: '#1C1C1E', fontWeight: '600' },
  eventRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 8,
                  borderBottomWidth: 1, borderBottomColor: '#F2F2F7', gap: 10 },
  eventIcon:    { fontSize: 20 },
  eventInfo:    { flex: 1 },
  eventLabel:   { fontSize: 14, fontWeight: '600', color: '#1C1C1E' },
  eventDetail:  { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  dtcCard:      { borderWidth: 1, borderColor: '#FF3B30' },
  dtcRow:       { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  dtcCode:      { fontSize: 15, fontWeight: '700', color: '#FF3B30', fontFamily: 'monospace' },
  dtcNote:      { fontSize: 12, color: '#8E8E93', marginTop: 8 },
  infoCard:     { backgroundColor: '#F0F8FF' },
  infoTitle:    { fontSize: 14, fontWeight: '600', color: '#007AFF', marginBottom: 8 },
  infoText:     { fontSize: 13, color: '#3C3C43', lineHeight: 20, marginBottom: 4 },
  infoNote:     { color: '#8E8E93', marginTop: 4 },
});
