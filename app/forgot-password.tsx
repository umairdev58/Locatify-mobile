import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
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
import { forgotPassword } from '@/api/auth';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canContinue = useMemo(() => email.trim().includes('@'), [email]);

  const handleSubmit = async () => {
    if (!canContinue || loading) return;
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      router.push({
        pathname: '/reset-code',
        params: { email: email.trim() },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to send reset email';
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

        <Text style={styles.title}>Forgot password</Text>
        <Text style={styles.subtitle}>Please enter your email to reset the password</Text>

        <Text style={[styles.label, { marginTop: 22 }]}>Your Email</Text>
        <TextInput
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (error) setError('');
          }}
          placeholder="Enter your email"
          placeholderTextColor="#9ca3af"
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable
          style={[
            styles.primaryButton,
            (!canContinue || loading) && styles.primaryButtonDisabled,
          ]}
          disabled={!canContinue || loading}
          onPress={handleSubmit}>
          <Text style={styles.primaryButtonText}>
            {loading ? 'Sending...' : 'Reset Password'}
          </Text>
        </Pressable>
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
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  input: {
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    fontSize: 16,
    color: '#111827',
  },
  primaryButton: {
    height: 54,
    borderRadius: 12,
    backgroundColor: '#5b86d6',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },
  primaryButtonDisabled: {
    backgroundColor: '#c9d7f2',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
});

