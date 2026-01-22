/**
 * Trip Detail Screen (Phase 12.4)
 *
 * 운행 상세 화면
 * - 운행 정보 표시
 * - 체크인 목록 (탑승/하차)
 * - 운행 시작/종료
 * - 승객 체크인 화면으로 이동
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Trip, TripStatus, TripType, CheckIn, CheckInType, Passenger } from '../types';
import * as tripApi from '../api/tripApi';
import * as checkinApi from '../api/checkinApi';
import { getCurrentLocation } from '../utils/location';

export const TripDetailScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const { tripId } = route.params;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [stats, setStats] = useState({
    totalCheckIns: 0,
    boardingCount: 0,
    alightingCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadTripDetail();
  }, [tripId]);

  const loadTripDetail = async () => {
    try {
      setLoading(true);
      const response = await tripApi.getTripDetail(tripId);

      if (response.success && response.data) {
        setTrip(response.data.trip);
        setPassengers(response.data.passengers || []);
        setCheckIns(response.data.checkIns);
        setStats(response.data.stats);
      }
    } catch (error: any) {
      Alert.alert(
        '데이터 로드 실패',
        error.response?.data?.message || '운행 정보를 불러오는데 실패했습니다.'
      );
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTripDetail();
    setRefreshing(false);
  };

  const handleStartTrip = async () => {
    Alert.alert('운행 시작', '운행을 시작하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '시작',
        onPress: async () => {
          try {
            setActionLoading(true);

            // GPS 위치 가져오기
            const location = await getCurrentLocation();
            if (!location) {
              Alert.alert('위치 오류', '위치 정보를 가져올 수 없습니다.');
              return;
            }

            // 운행 시작 API 호출
            const response = await tripApi.startTrip(tripId, location);

            if (response.success) {
              Alert.alert('운행 시작', '운행이 시작되었습니다.');
              await loadTripDetail(); // 데이터 새로고침
            }
          } catch (error: any) {
            Alert.alert(
              '운행 시작 실패',
              error.response?.data?.message || '운행 시작에 실패했습니다.'
            );
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const handleEndTrip = async () => {
    Alert.alert('운행 종료', '운행을 종료하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '종료',
        style: 'destructive',
        onPress: async () => {
          try {
            setActionLoading(true);

            // GPS 위치 가져오기
            const location = await getCurrentLocation();
            if (!location) {
              Alert.alert('위치 오류', '위치 정보를 가져올 수 없습니다.');
              return;
            }

            // 운행 종료 API 호출
            const response = await tripApi.endTrip(tripId, location);

            if (response.success) {
              Alert.alert('운행 종료', '운행이 종료되었습니다.', [
                {
                  text: '확인',
                  onPress: () => navigation.goBack(),
                },
              ]);
            }
          } catch (error: any) {
            Alert.alert(
              '운행 종료 실패',
              error.response?.data?.message || '운행 종료에 실패했습니다.'
            );
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const handleQuickCheckIn = async (
    passengerId: string,
    passengerName: string,
    type: CheckInType
  ) => {
    const typeLabel = type === CheckInType.BOARDING ? '탑승' : '하차';
    Alert.alert(
      `${typeLabel} 체크인`,
      `${passengerName} 승객을 ${typeLabel} 처리하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '확인',
          onPress: async () => {
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
                passengerId,
                type,
                location
              );

              if (response.success) {
                Alert.alert('체크인 완료', `${passengerName} 승객의 ${typeLabel} 체크인이 완료되었습니다.`);
                // 데이터 새로고침
                await loadTripDetail();
              }
            } catch (error: any) {
              const errorMessage =
                error.response?.data?.message || '체크인에 실패했습니다.';
              Alert.alert('체크인 실패', errorMessage);
            }
          },
        },
      ]
    );
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

  const getCheckInTypeLabel = (type: CheckInType): string => {
    return type === CheckInType.BOARDING ? '탑승' : '하차';
  };

  const getCheckInTypeBadgeColor = (type: CheckInType): string => {
    return type === CheckInType.BOARDING ? '#34C759' : '#FF9500';
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!trip) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>운행 정보를 찾을 수 없습니다.</Text>
      </View>
    );
  }

  const isInProgress = trip.status === TripStatus.IN_PROGRESS;
  const isScheduled = trip.status === TripStatus.SCHEDULED;
  const isCompleted = trip.status === TripStatus.COMPLETED;

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>운행 상세</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 운행 정보 카드 */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.tripType}>
              <Text style={styles.tripTypeText}>
                {getTripTypeLabel(trip.type)}
              </Text>
            </View>
            <View
              style={[
                styles.tripStatus,
                { backgroundColor: getTripStatusColor(trip.status) },
              ]}
            >
              <Text style={styles.tripStatusText}>
                {getTripStatusLabel(trip.status)}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>출발 예정</Text>
            <Text style={styles.infoValue}>
              {new Date(trip.scheduledStart).toLocaleString('ko-KR', {
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>

          {trip.actualStart && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>실제 출발</Text>
              <Text style={styles.infoValue}>
                {new Date(trip.actualStart).toLocaleString('ko-KR', {
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          )}

          {trip.actualEnd && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>실제 도착</Text>
              <Text style={styles.infoValue}>
                {new Date(trip.actualEnd).toLocaleString('ko-KR', {
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          )}
        </View>

        {/* 체크인 통계 */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>체크인 현황</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalCheckIns}</Text>
              <Text style={styles.statLabel}>전체</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#34C759' }]}>
                {stats.boardingCount}
              </Text>
              <Text style={styles.statLabel}>탑승</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#FF9500' }]}>
                {stats.alightingCount}
              </Text>
              <Text style={styles.statLabel}>하차</Text>
            </View>
          </View>
        </View>

        {/* 승객 목록 (운행 중일 때만 표시) */}
        {isInProgress && passengers.length > 0 && (
          <View style={styles.passengersSection}>
            <Text style={styles.sectionTitle}>승객 목록</Text>
            <Text style={styles.sectionSubtitle}>
              탑승 순서대로 표시됩니다. 버튼을 클릭하여 체크인하세요.
            </Text>
            {passengers.map((passenger) => {
              // 해당 승객의 체크인 상태 확인
              const boardingCheckIn = checkIns.find(
                (c) => c.passengerId === passenger.id && c.type === CheckInType.BOARDING
              );
              const alightingCheckIn = checkIns.find(
                (c) => c.passengerId === passenger.id && c.type === CheckInType.ALIGHTING
              );

              return (
                <View key={passenger.id} style={styles.passengerCard}>
                  <View style={styles.passengerInfo}>
                    <View style={styles.passengerHeader}>
                      <View style={styles.passengerSequence}>
                        <Text style={styles.passengerSequenceText}>
                          {passenger.sequence}
                        </Text>
                      </View>
                      <View style={styles.passengerDetails}>
                        <Text style={styles.passengerName}>{passenger.name}</Text>
                        <Text style={styles.passengerAddress} numberOfLines={1}>
                          {passenger.address}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.passengerActions}>
                      <TouchableOpacity
                        style={[
                          styles.checkInActionButton,
                          styles.boardingButton,
                          boardingCheckIn && styles.checkInActionButtonDisabled,
                        ]}
                        onPress={() =>
                          handleQuickCheckIn(
                            passenger.id,
                            passenger.name,
                            CheckInType.BOARDING
                          )
                        }
                        disabled={!!boardingCheckIn}
                      >
                        <Text
                          style={[
                            styles.checkInActionButtonText,
                            boardingCheckIn && styles.checkInActionButtonTextDisabled,
                          ]}
                        >
                          {boardingCheckIn ? '✓ 탑승' : '탑승'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.checkInActionButton,
                          styles.alightingButton,
                          (!boardingCheckIn || alightingCheckIn) &&
                            styles.checkInActionButtonDisabled,
                        ]}
                        onPress={() =>
                          handleQuickCheckIn(
                            passenger.id,
                            passenger.name,
                            CheckInType.ALIGHTING
                          )
                        }
                        disabled={!boardingCheckIn || !!alightingCheckIn}
                      >
                        <Text
                          style={[
                            styles.checkInActionButtonText,
                            (!boardingCheckIn || alightingCheckIn) &&
                              styles.checkInActionButtonTextDisabled,
                          ]}
                        >
                          {alightingCheckIn ? '✓ 하차' : '하차'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* 체크인 목록 */}
        <View style={styles.checkInsSection}>
          <Text style={styles.sectionTitle}>체크인 목록</Text>
          {checkIns.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>체크인 기록이 없습니다.</Text>
            </View>
          ) : (
            checkIns.map((checkIn) => (
              <View key={checkIn.id} style={styles.checkInItem}>
                <View
                  style={[
                    styles.checkInTypeBadge,
                    {
                      backgroundColor: getCheckInTypeBadgeColor(checkIn.type),
                    },
                  ]}
                >
                  <Text style={styles.checkInTypeBadgeText}>
                    {getCheckInTypeLabel(checkIn.type)}
                  </Text>
                </View>
                <View style={styles.checkInInfo}>
                  <Text style={styles.checkInPassengerId}>
                    승객 ID: {checkIn.passengerId.slice(0, 8)}...
                  </Text>
                  <Text style={styles.checkInTime}>
                    {new Date(checkIn.timestamp).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* 하단 액션 버튼 */}
      <View style={styles.actionButtons}>
        {isScheduled && (
          <TouchableOpacity
            style={[styles.actionButton, styles.startButton]}
            onPress={handleStartTrip}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.actionButtonText}>운행 시작</Text>
            )}
          </TouchableOpacity>
        )}

        {isInProgress && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.checkInButton]}
              onPress={() =>
                navigation.navigate('CheckIn', { tripId: trip.id })
              }
              disabled={actionLoading}
            >
              <Text style={styles.actionButtonText}>승객 체크인</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.endButton]}
              onPress={handleEndTrip}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.actionButtonText}>운행 종료</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {isCompleted && (
          <View style={styles.completedMessage}>
            <Text style={styles.completedMessageText}>
              운행이 완료되었습니다.
            </Text>
          </View>
        )}
      </View>
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
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  checkInsSection: {
    marginBottom: 100,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
  },
  passengersSection: {
    marginBottom: 24,
  },
  passengerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  passengerInfo: {
    flex: 1,
  },
  passengerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  passengerSequence: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  passengerSequenceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  passengerDetails: {
    flex: 1,
  },
  passengerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  passengerAddress: {
    fontSize: 12,
    color: '#666',
  },
  passengerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  checkInActionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
  },
  boardingButton: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  alightingButton: {
    backgroundColor: '#FF9500',
    borderColor: '#FF9500',
  },
  checkInActionButtonDisabled: {
    backgroundColor: '#f0f0f0',
    borderColor: '#ddd',
  },
  checkInActionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  checkInActionButtonTextDisabled: {
    color: '#999',
  },
  checkInItem: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  checkInTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 12,
  },
  checkInTypeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  checkInInfo: {
    flex: 1,
  },
  checkInPassengerId: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  checkInTime: {
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  errorText: {
    fontSize: 16,
    color: '#999',
  },
  actionButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  actionButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  startButton: {
    backgroundColor: '#34C759',
  },
  checkInButton: {
    backgroundColor: '#007AFF',
  },
  endButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  completedMessage: {
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  completedMessageText: {
    fontSize: 14,
    color: '#666',
  },
});
