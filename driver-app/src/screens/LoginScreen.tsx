import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('입력 오류', '이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (e: any) {
      Alert.alert('로그인 실패', e?.message || '이메일 또는 비밀번호를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        {/* 로고 영역 */}
        <View style={styles.logoArea}>
          <Text style={styles.logoIcon}>🚌</Text>
          <Text style={styles.appName}>픽업 드라이버</Text>
          <Text style={styles.appSub}>기사 전용 앱</Text>
        </View>

        {/* 로그인 폼 */}
        <View style={styles.form}>
          <Text style={styles.inputLabel}>이메일</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="driver@example.com"
            placeholderTextColor="#C7C7CC"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <Text style={styles.inputLabel}>비밀번호</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="비밀번호"
            placeholderTextColor="#C7C7CC"
            secureTextEntry
            autoComplete="password"
          />

          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.loginBtnText}>로그인</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#F2F2F7' },
  inner:           { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  logoArea:        { alignItems: 'center', marginBottom: 48 },
  logoIcon:        { fontSize: 60, marginBottom: 12 },
  appName:         { fontSize: 28, fontWeight: '700', color: '#1C1C1E' },
  appSub:          { fontSize: 14, color: '#8E8E93', marginTop: 4 },
  form:            { gap: 8 },
  inputLabel:      { fontSize: 13, fontWeight: '600', color: '#3C3C43', marginBottom: 2 },
  input:           { backgroundColor: '#fff', borderRadius: 10, padding: 14,
                     fontSize: 16, color: '#1C1C1E',
                     borderWidth: 1, borderColor: '#E5E5EA', marginBottom: 12 },
  loginBtn:        { backgroundColor: '#007AFF', borderRadius: 12,
                     paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  loginBtnDisabled:{ opacity: 0.6 },
  loginBtnText:    { fontSize: 17, fontWeight: '700', color: '#fff' },
});
