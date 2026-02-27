/**
 * QrScanScreen — QR 코드 스캔으로 승객 자동 체크인
 *
 * 사용 방법:
 *   expo-camera CameraView 기반 QR 스캔
 *   스캔 성공 → POST /api/v1/driver/check_ins/qr_scan
 *   결과 표시 후 TripDetail로 복귀
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Vibration,
} from 'react-native';
import { apiClient } from '../api/apiClient';

// expo-camera가 없을 경우 graceful fallback
let CameraView: any = null;
let useCameraPermissions: (() => [any, () => Promise<void>]) | null = null;
try {
  const cam = require('expo-camera');
  CameraView          = cam.CameraView;
  useCameraPermissions = cam.useCameraPermissions;
} catch {
  // expo-camera 미설치 환경에서는 대체 UI 표시
}

type ScanResult =
  | { status: 'idle' }
  | { status: 'scanning' }
  | { status: 'success'; passengerName: string }
  | { status: 'error'; message: string };

export const QrScanScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const { tripId } = route.params as { tripId: number };
  const [result, setResult] = useState<ScanResult>({ status: 'idle' });
  const [scanned, setScanned] = useState(false);

  // expo-camera 없는 환경 처리
  if (!CameraView || !useCameraPermissions) {
    return (
      <View style={styles.fallbackContainer}>
        <Text style={styles.fallbackTitle}>QR 스캔 기능</Text>
        <Text style={styles.fallbackDesc}>
          QR 스캔을 사용하려면 expo-camera 패키지가 필요합니다.
        </Text>
        <Text style={styles.fallbackCode}>
          npx expo install expo-camera
        </Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <QrScanView tripId={tripId} navigation={navigation} />;
};

// ─── 실제 카메라 스캔 뷰 ─────────────────────────────────────────
const QrScanView: React.FC<{ tripId: number; navigation: any }> = ({
  tripId,
  navigation,
}) => {
  const [permission, requestPermission] = (useCameraPermissions as NonNullable<typeof useCameraPermissions>)();
  const [result, setResult] = useState<ScanResult>({ status: 'idle' });
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setResult({ status: 'scanning' });
    Vibration.vibrate(100);

    try {
      const res = await apiClient.post('/driver/check_ins/qr_scan', {
        qr_data: data,
        trip_id: tripId,
      });

      if (res.data?.success) {
        const { passenger_name } = res.data.data;
        setResult({ status: 'success', passengerName: passenger_name });
        Vibration.vibrate([0, 100, 100, 100]); // 성공 패턴
        setTimeout(() => {
          navigation.goBack();
        }, 1800);
      } else {
        setResult({ status: 'error', message: res.data?.error || '처리 실패' });
        setTimeout(() => {
          setResult({ status: 'idle' });
          setScanned(false);
        }, 2500);
      }
    } catch (e: any) {
      const msg = e?.response?.data?.error || 'QR 처리에 실패했습니다.';
      setResult({ status: 'error', message: msg });
      setTimeout(() => {
        setResult({ status: 'idle' });
        setScanned(false);
      }, 2500);
    }
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permText}>카메라 권한이 필요합니다.</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>권한 허용</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBack}>
          <Text style={styles.headerBackText}>← 닫기</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>QR 스캔 체크인</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* 카메라 뷰 */}
      <View style={styles.cameraContainer}>
        {CameraView && (
          <CameraView
            style={StyleSheet.absoluteFillObject}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          />
        )}

        {/* 스캔 가이드 오버레이 */}
        <View style={styles.overlay}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <Text style={styles.hint}>승객의 QR 코드를 사각형 안에 맞춰주세요</Text>
        </View>
      </View>

      {/* 결과 오버레이 */}
      {result.status !== 'idle' && (
        <View style={styles.resultOverlay}>
          {result.status === 'scanning' && (
            <View style={[styles.resultCard, styles.cardScanning]}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.resultText}>처리 중...</Text>
            </View>
          )}
          {result.status === 'success' && (
            <View style={[styles.resultCard, styles.cardSuccess]}>
              <Text style={styles.resultIcon}>✓</Text>
              <Text style={styles.resultTitle}>탑승 완료</Text>
              <Text style={styles.resultSubtitle}>{result.passengerName}</Text>
            </View>
          )}
          {result.status === 'error' && (
            <View style={[styles.resultCard, styles.cardError]}>
              <Text style={styles.resultIcon}>✗</Text>
              <Text style={styles.resultTitle}>처리 실패</Text>
              <Text style={styles.resultSubtitle}>{result.message}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const FRAME_SIZE = 240;
const CORNER_SIZE = 28;
const CORNER_WIDTH = 4;
const CORNER_COLOR = '#fff';

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#000' },
  center:       { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F2F7' },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                  backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 16,
                  paddingTop: 56, paddingBottom: 12, zIndex: 10 },
  headerBack:   { padding: 4 },
  headerBackText: { fontSize: 16, color: '#fff' },
  headerTitle:  { fontSize: 17, fontWeight: '600', color: '#fff' },
  cameraContainer: { flex: 1, position: 'relative' },
  overlay:      { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  scanFrame:    { width: FRAME_SIZE, height: FRAME_SIZE, position: 'relative' },
  hint:         { color: '#fff', fontSize: 13, marginTop: 20, textAlign: 'center',
                  textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },
  corner:       { position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE, borderColor: CORNER_COLOR },
  topLeft:      { top: 0, left: 0, borderTopWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH },
  topRight:     { top: 0, right: 0, borderTopWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH },
  bottomLeft:   { bottom: 0, left: 0, borderBottomWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH },
  bottomRight:  { bottom: 0, right: 0, borderBottomWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH },
  resultOverlay:{ ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center',
                  backgroundColor: 'rgba(0,0,0,0.6)' },
  resultCard:   { width: 220, borderRadius: 20, padding: 28, alignItems: 'center', gap: 8 },
  cardScanning: { backgroundColor: '#fff' },
  cardSuccess:  { backgroundColor: '#34C759' },
  cardError:    { backgroundColor: '#FF3B30' },
  resultIcon:   { fontSize: 48, color: '#fff', fontWeight: '700' },
  resultTitle:  { fontSize: 20, fontWeight: '700', color: '#fff' },
  resultSubtitle: { fontSize: 15, color: 'rgba(255,255,255,0.85)', textAlign: 'center' },
  resultText:   { fontSize: 16, color: '#1C1C1E', marginTop: 8 },
  permText:     { fontSize: 16, color: '#1C1C1E', marginBottom: 16 },
  permBtn:      { backgroundColor: '#007AFF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  permBtnText:  { color: '#fff', fontSize: 16, fontWeight: '600' },
  // 폴백 스타일
  fallbackContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F2F7', padding: 32 },
  fallbackTitle:    { fontSize: 20, fontWeight: '700', color: '#1C1C1E', marginBottom: 12 },
  fallbackDesc:     { fontSize: 15, color: '#8E8E93', textAlign: 'center', marginBottom: 16 },
  fallbackCode:     { fontSize: 13, color: '#007AFF', fontFamily: 'monospace', backgroundColor: '#E3F0FF',
                      paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginBottom: 24 },
  backBtn:          { backgroundColor: '#007AFF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  backBtnText:      { color: '#fff', fontSize: 16, fontWeight: '600' },
});
