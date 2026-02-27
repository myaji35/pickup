/**
 * CheckIn Screen (Phase 12.4)
 *
 * 승객 체크인/하차 화면
 * - 승객 ID 입력 (또는 QR 스캔)
 * - 탑승/하차 선택
 * - GPS 위치 자동 기록
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { CheckInType } from '../types';
import * as checkinApi from '../api/checkinApi';
import { getCurrentLocation } from '../utils/location';

export const CheckInScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const { tripId } = route.params;

  const [passengerId, setPassengerId] = useState('');
  const [selectedType, setSelectedType] = useState<CheckInType>(
    CheckInType.BOARDING
  );
  const [loading, setLoading] = useState(false);

  const handleCheckIn = async () => {
    // 입력 검증
    if (!passengerId.trim()) {
      Alert.alert('입력 오류', '승객 ID를 입력해주세요.');
      return;
    }

    setLoading(true);

    try {
      // GPS 위치 가져오기
      const location = await getCurrentLocation();
      if (!location) {
        Alert.alert('위치 오류', '위치 정보를 가져올 수 없습니다.');
        return;
      }

      // 체크인 생성 API 호출
      const response = await checkinApi.createCheckIn(
        tripId,
        passengerId.trim(),
        selectedType,
        location
      );

      if (response.success) {
        Alert.alert(
          '체크인 완료',
          `${selectedType === CheckInType.BOARDING ? '탑승' : '하차'} 체크인이 완료되었습니다.`,
          [
            {
              text: '확인',
              onPress: () => {
                // 입력 필드 초기화
                setPassengerId('');
                // 이전 화면으로 돌아가기 (TripDetail로 자동 새로고침)
                navigation.goBack();
              },
            },
          ]
        );
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || '체크인에 실패했습니다.';
      Alert.alert('체크인 실패', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>승객 체크인</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.content}>
        {/* 체크인 타입 선택 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>체크인 유형</Text>
          <View style={styles.typeButtons}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                selectedType === CheckInType.BOARDING &&
                  styles.typeButtonActive,
                { marginRight: 8 },
              ]}
              onPress={() => setSelectedType(CheckInType.BOARDING)}
              disabled={loading}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  selectedType === CheckInType.BOARDING &&
                    styles.typeButtonTextActive,
                ]}
              >
                탑승
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeButton,
                selectedType === CheckInType.ALIGHTING &&
                  styles.typeButtonActive,
              ]}
              onPress={() => setSelectedType(CheckInType.ALIGHTING)}
              disabled={loading}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  selectedType === CheckInType.ALIGHTING &&
                    styles.typeButtonTextActive,
                ]}
              >
                하차
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 승객 ID 입력 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>승객 ID</Text>
          <TextInput
            style={styles.input}
            placeholder="승객 ID를 입력하세요"
            placeholderTextColor="#999"
            value={passengerId}
            onChangeText={setPassengerId}
            autoCapitalize="none"
            editable={!loading}
            onSubmitEditing={handleCheckIn}
          />
          <Text style={styles.helperText}>
            * 실제 서비스에서는 QR 코드 스캔 또는 승객 목록 선택을 사용합니다.
          </Text>
        </View>

        {/* QR 스캔 버튼 (TODO) */}
        <TouchableOpacity
          style={styles.qrButton}
          onPress={() =>
            Alert.alert('QR 스캔', 'QR 스캔 기능은 추후 구현 예정입니다.')
          }
          disabled={loading}
        >
          <Text style={styles.qrButtonText}>📷 QR 코드 스캔</Text>
        </TouchableOpacity>

        {/* 체크인 버튼 */}
        <TouchableOpacity
          style={[
            styles.checkInButton,
            selectedType === CheckInType.BOARDING
              ? styles.checkInButtonBoarding
              : styles.checkInButtonAlighting,
            loading && styles.checkInButtonDisabled,
          ]}
          onPress={handleCheckIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.checkInButtonText}>
              {selectedType === CheckInType.BOARDING ? '탑승' : '하차'} 체크인
            </Text>
          )}
        </TouchableOpacity>

        {/* 안내 메시지 */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>체크인 안내</Text>
          <Text style={styles.infoText}>
            • 체크인 시 GPS 위치가 자동으로 기록됩니다.
          </Text>
          <Text style={styles.infoText}>
            • 같은 승객을 같은 유형으로 중복 체크인할 수 없습니다.
          </Text>
          <Text style={styles.infoText}>
            • 탑승 후 하차 체크인이 가능합니다.
          </Text>
        </View>

        {/* 개발 모드 테스트 정보 */}
        {__DEV__ && (
          <View style={styles.devInfo}>
            <Text style={styles.devInfoText}>개발 모드</Text>
            <Text style={styles.devInfoText}>
              테스트용 승객 ID: passenger-1, passenger-2
            </Text>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    width: 60,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  typeButtons: {
    flexDirection: 'row',
  },
  typeButton: {
    flex: 1,
    padding: 16,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  typeButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#333',
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  qrButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  qrButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  checkInButton: {
    padding: 18,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  checkInButtonBoarding: {
    backgroundColor: '#34C759',
  },
  checkInButtonAlighting: {
    backgroundColor: '#FF9500',
  },
  checkInButtonDisabled: {
    backgroundColor: '#999',
  },
  checkInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  devInfo: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  devInfoText: {
    fontSize: 12,
    color: '#856404',
    textAlign: 'center',
  },
});
