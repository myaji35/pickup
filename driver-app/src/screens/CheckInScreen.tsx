// CheckIn 기능은 TripDetailScreen의 PassengerRow에 통합됨
// 이 파일은 네비게이터 호환성을 위해 유지
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const CheckInScreen: React.FC<{ navigation: any }> = ({ navigation }) => (
  <View style={styles.container}>
    <Text style={styles.text}>체크인은 운행 상세 화면에서 진행해주세요.</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F2F7' },
  text:      { fontSize: 16, color: '#8E8E93', textAlign: 'center', paddingHorizontal: 32 },
});
