/**
 * LoginScreen — Epic 8
 */

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { RegisterScreen } from './RegisterScreen';

export const LoginScreen: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [showRegister, setShowRegister] = useState(false);

  if (showRegister) {
    return <RegisterScreen onBackToLogin={() => setShowRegister(false)} />;
  }

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('입력 오류', '이메일과 비밀번호를 입력해주세요.');
      return;
    }
    try {
      await login(email, password);
    } catch (error: any) {
      Alert.alert('로그인 실패', error.response?.data?.message || '이메일 또는 비밀번호를 확인해주세요.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* 로고 영역 */}
        <View style={styles.logoArea}>
          <Text style={styles.logo}>P</Text>
          <Text style={styles.title}>Pickup</Text>
          <Text style={styles.subtitle}>보호자 앱</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="이메일"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!isLoading}
          />
          <TextInput
            style={styles.input}
            placeholder="비밀번호"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>로그인</Text>
            }
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.registerLink}
          onPress={() => setShowRegister(true)}
        >
          <Text style={styles.registerLinkText}>
            처음 이용하시나요? <Text style={styles.registerLinkBold}>초대 코드로 가입</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  logoArea: { alignItems: 'center', marginBottom: 40 },
  logo: {
    width: 72, height: 72, borderRadius: 20, backgroundColor: '#2563eb',
    textAlign: 'center', lineHeight: 72, fontSize: 36, fontWeight: 'bold', color: '#fff',
    overflow: 'hidden',
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1e293b', marginTop: 12 },
  subtitle: { fontSize: 15, color: '#64748b', marginTop: 4 },
  form: { gap: 14 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 10, padding: 16, fontSize: 16,
  },
  button: {
    backgroundColor: '#2563eb', borderRadius: 10, padding: 16,
    alignItems: 'center', marginTop: 4,
  },
  buttonDisabled: { backgroundColor: '#94a3b8' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  registerLink: { marginTop: 28, alignItems: 'center' },
  registerLinkText: { color: '#64748b', fontSize: 14 },
  registerLinkBold: { color: '#2563eb', fontWeight: '700' },
});
