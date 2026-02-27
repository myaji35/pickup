/**
 * RegisterScreen — Epic 8
 * 보호자 회원가입 (초대 코드 기반)
 */

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export const RegisterScreen: React.FC<{ onBackToLogin: () => void }> = ({ onBackToLogin }) => {
  const { register, isLoading } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [inviteCode, setInviteCode] = useState('');
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');

  const handleNext = () => {
    if (!inviteCode.trim()) {
      Alert.alert('입력 오류', '초대 코드를 입력해주세요.');
      return;
    }
    setStep(2);
  };

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('입력 오류', '모든 항목을 입력해주세요.');
      return;
    }
    try {
      await register({ email, password, name, invite_code: inviteCode.trim().toUpperCase() });
    } catch (error: any) {
      Alert.alert('회원가입 실패', error.response?.data?.message || '다시 시도해주세요.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>보호자 앱 가입</Text>
        <Text style={styles.subtitle}>
          {step === 1 ? '초대 코드 입력 (1/2)' : '계정 정보 입력 (2/2)'}
        </Text>

        {/* Step 진행 바 */}
        <View style={styles.stepBar}>
          <View style={[styles.stepSegment, { backgroundColor: '#2563eb' }]} />
          <View style={[styles.stepSegment, { backgroundColor: step === 2 ? '#2563eb' : '#e2e8f0' }]} />
        </View>

        {step === 1 ? (
          <View style={styles.form}>
            <Text style={styles.label}>초대 코드</Text>
            <TextInput
              style={styles.input}
              placeholder="예: ABC12XYZ"
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="characters"
              maxLength={8}
            />
            <Text style={styles.hint}>
              초대 코드는 기관 담당자 또는 관리자 앱에서 확인할 수 있습니다.
            </Text>
            <TouchableOpacity style={styles.button} onPress={handleNext}>
              <Text style={styles.buttonText}>다음</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="이름"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder="이메일"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              placeholder="비밀번호 (6자 이상)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.buttonText}>가입 완료</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStep(1)}>
              <Text style={styles.backText}>이전으로</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity onPress={onBackToLogin} style={styles.loginLink}>
          <Text style={styles.loginLinkText}>이미 계정이 있으신가요? 로그인</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 24, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#2563eb', textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 15, color: '#64748b', textAlign: 'center', marginBottom: 20 },
  stepBar: { flexDirection: 'row', gap: 8, marginBottom: 28 },
  stepSegment: { flex: 1, height: 4, borderRadius: 2 },
  form: { gap: 14 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151' },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: 10, padding: 14, fontSize: 16,
  },
  hint: { fontSize: 12, color: '#94a3b8', lineHeight: 18 },
  button: {
    backgroundColor: '#2563eb', borderRadius: 10, padding: 16,
    alignItems: 'center', marginTop: 4,
  },
  buttonDisabled: { backgroundColor: '#94a3b8' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  backText: { textAlign: 'center', color: '#64748b', marginTop: 8 },
  loginLink: { marginTop: 32, alignItems: 'center' },
  loginLinkText: { color: '#2563eb', fontSize: 14 },
});
