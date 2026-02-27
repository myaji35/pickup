import * as Location from 'expo-location';
import { GpsLocation } from '../types';
import { Alert } from 'react-native';

export const requestLocationPermission = async (): Promise<boolean> => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('위치 권한 필요', '운행을 위해 위치 권한이 필요합니다.');
    return false;
  }
  return true;
};

export const getCurrentLocation = async (): Promise<GpsLocation | null> => {
  try {
    const ok = await requestLocationPermission();
    if (!ok) return null;

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      lat: loc.coords.latitude,
      lng: loc.coords.longitude,
      heading: loc.coords.heading ?? undefined,
      speed: loc.coords.speed != null ? loc.coords.speed * 3.6 : undefined, // m/s → km/h
    };
  } catch {
    Alert.alert('위치 오류', 'GPS를 켜주세요.');
    return null;
  }
};

// 운행 중 위치 감시 (5초 간격)
export const watchLocation = (
  onUpdate: (loc: GpsLocation) => void
): (() => void) => {
  let subscription: Location.LocationSubscription | null = null;

  Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: 5000,
      distanceInterval: 10, // 10m 이상 이동 시에만 업데이트
    },
    (loc) => {
      onUpdate({
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        heading: loc.coords.heading ?? undefined,
        speed: loc.coords.speed != null ? loc.coords.speed * 3.6 : undefined,
      });
    }
  ).then((sub) => {
    subscription = sub;
  });

  return () => subscription?.remove();
};
