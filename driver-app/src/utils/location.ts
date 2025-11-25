/**
 * Location Utility (Phase 12.4)
 *
 * GPS 위치 수집 유틸리티
 */

import * as Location from 'expo-location';
import { GpsLocation } from '../types';
import { Alert } from 'react-native';

/**
 * 위치 권한 요청
 */
export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        '위치 권한 필요',
        '운행 시작/종료 및 체크인을 위해 위치 권한이 필요합니다.'
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to request location permission:', error);
    return false;
  }
};

/**
 * 현재 위치 가져오기
 */
export const getCurrentLocation = async (): Promise<GpsLocation | null> => {
  try {
    // 권한 확인
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      return null;
    }

    // 현재 위치 가져오기
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      lat: location.coords.latitude,
      lng: location.coords.longitude,
    };
  } catch (error) {
    console.error('Failed to get current location:', error);
    Alert.alert(
      '위치 오류',
      '현재 위치를 가져올 수 없습니다. GPS가 켜져 있는지 확인해주세요.'
    );
    return null;
  }
};

/**
 * 위치 권한 상태 확인
 */
export const checkLocationPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Failed to check location permission:', error);
    return false;
  }
};
