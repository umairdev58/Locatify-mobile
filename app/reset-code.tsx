import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Text } from '@/components/Themed';
import { verifyResetCodeApi } from '@/api/auth';

function maskEmail(email: string) {
  const [user, domain] = email.split('@');
  if (!user || !domain) return email;
  const safeUser = user.length <= 2 ? `${user[0] ?? ''}…` : `${user.slice(0, 2)}…`;
  const safeDomain = domain.length <= 6 ? domain : `${domain.slice(0, 6)}…`;
  return `${safeUser}@${safeDomain}`;
}

export default function ResetCodeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = (params.email ?? '').toString();

  const [code, setCode] = useState(['', '', '', '', '']);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    inputRefs.current[0]?.focus?.();
  }, []);

  const codeString = useMemo(() => code.join(''), [code]);
  const canVerify = codeString.length === 5 && code.every((d) => d !== '');

  const handleChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;
    const next = [...code];
    next[index] = value;
    setCode(next);
    if (value && index < next.length - 1) {
      inputRefs.current[index + 1]?.focus?.();
    }
    if (error) setError('');
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus?.();
    }
  };

  const handleVerify = async () => {
    if (!canVerify || loading) return;
    setError('');
    setLoading(true);
    try {
      await verifyResetCodeApi({ email, code: codeString });
      router.push({
        pathname: '/password-reset',
        params: { email, code: codeString },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to verify code';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={10}>
          <FontAwesome name="chevron-left" size={18} color="#111827" />
        </Pressable>

        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.subtitle}>
          We sent a reset link to <Text style={styles.subtitleStrong}>{maskEmail(email)}</Text>
          {'\n'}
          enter 5 digit code that mentioned in the email
        </Text>

        <View style={styles.codeRow}>
          {code.map((digit, idx) => (
            <TextInput
              key={idx}
              ref={(r) => {
                inputRefs.current[idx] = r;
              }}
              value={digit}
              onChangeText={(v) => handleChange(idx, v)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(idx, nativeEvent.key)}
              style={styles.codeInput}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable
          style={[
            styles.primaryButton,
            (!canVerify || loading) && styles.primaryButtonDisabled,
          ]}
          disabled={!canVerify || loading}
          onPress={handleVerify}>
          <Text style={styles.primaryButtonText}>
            {loading ? 'Verifying...' : 'Verify Code'}
          </Text>
        </Pressable>

        <View style={styles.resendRow}>
          <Text style={styles.resendText}>Haven’t got the email yet? </Text>
          <Pressable onPress={() => {}}>
            <Text style={styles.resendLink}>Resend email</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  errorText: {
    marginTop: 10,
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '600',
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 32,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#efefef',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    color: '#9ca3af',
    fontWeight: '600',
    lineHeight: 20,
  },
  subtitleStrong: {
    color: '#111827',
    fontWeight: '800',
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 22,
  },
  codeInput: {
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#5b86d6',
    backgroundColor: '#ffffff',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  primaryButton: {
    height: 54,
    borderRadius: 12,
    backgroundColor: '#5b86d6',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  primaryButtonDisabled: {
    backgroundColor: '#c9d7f2',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 22,
  },
  resendText: {
    color: '#9ca3af',
    fontWeight: '600',
  },
  resendLink: {
    color: '#5b86d6',
    fontWeight: '800',
  },
});

