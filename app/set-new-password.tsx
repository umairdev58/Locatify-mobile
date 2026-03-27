import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { resetPasswordApi } from '@/api/auth';

export default function SetNewPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; code?: string }>();
  const email = (params.email ?? '').toString();
  const code = (params.code ?? '').toString();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pwVisible, setPwVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const hasValues = password.length > 0 && confirm.length > 0;
  const matches = password === confirm;
  const canSubmit = useMemo(
    () => hasValues && matches && password.length >= 6,
    [hasValues, matches, password]
  );

  const handleSubmit = async () => {
    if (!canSubmit || loading) return;
    setError('');
    setLoading(true);
    try {
      await resetPasswordApi({ email, code, newPassword: password });
      router.replace({
        pathname: '/reset-success',
        params: { email },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to update password';
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

        <Text style={styles.title}>Set a new password</Text>
        <Text style={styles.subtitle}>
          Create a new password. Ensure it differs from previous ones for security
        </Text>

        <Text style={[styles.label, { marginTop: 22 }]}>Password</Text>
        <View style={styles.inputRow}>
          <TextInput
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (error) setError('');
            }}
            placeholder="Enter your new password"
            placeholderTextColor="#9ca3af"
            style={styles.input}
            secureTextEntry={!pwVisible}
          />
          <Pressable style={styles.eyeButton} onPress={() => setPwVisible((v) => !v)} hitSlop={10}>
            <FontAwesome name={pwVisible ? 'eye-slash' : 'eye'} size={18} color="#c7c7cc" />
          </Pressable>
        </View>

        <Text style={[styles.label, { marginTop: 18 }]}>Confirm Password</Text>
        <View style={styles.inputRow}>
          <TextInput
            value={confirm}
            onChangeText={(text) => {
              setConfirm(text);
              if (error) setError('');
            }}
            placeholder="Re-enter password"
            placeholderTextColor="#9ca3af"
            style={styles.input}
            secureTextEntry={!confirmVisible}
          />
          <Pressable
            style={styles.eyeButton}
            onPress={() => setConfirmVisible((v) => !v)}
            hitSlop={10}>
            <FontAwesome
              name={confirmVisible ? 'eye-slash' : 'eye'}
              size={18}
              color="#c7c7cc"
            />
          </Pressable>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable
          style={[
            styles.primaryButton,
            (!canSubmit || loading) && styles.primaryButtonDisabled,
          ]}
          disabled={!canSubmit || loading}
          onPress={handleSubmit}>
          <Text style={styles.primaryButtonText}>
            {loading ? 'Updating...' : 'Update Password'}
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
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
  },
  inputRow: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    paddingLeft: 16,
    paddingRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  eyeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
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

