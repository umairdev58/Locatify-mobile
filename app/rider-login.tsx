import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Pressable,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useState } from 'react';

import { Text } from '@/components/Themed';
import { requestOTP } from '@/api/rider';

export default function RiderLoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; accountType?: string }>();
  const mode = params.mode || 'login';
  const accountType = params.accountType || 'rider';
  const isSignup = mode === 'signup';

  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const hasError = !!errorMessage;

  const handleRequestOTP = async () => {
    if (!phone || phone.trim().length === 0) {
      setErrorMessage('Please enter your phone number');
      return;
    }

    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      setErrorMessage('Please enter a valid phone number');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const response = await requestOTP({ phone: phone.trim() });
      setSuccessMessage(`OTP sent to ${response.phone}`);

      setTimeout(() => {
        router.push({
          pathname: '/rider-verify-otp',
          params: { phone: response.phone, mode, accountType },
        });
      }, 800);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to send OTP';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroContent}>
            <View style={styles.brandRow}>
              <View style={styles.logoWrap}>
                <Image
                  source={require('../assets/images/icon.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.appName}>Locatify</Text>
                <Text style={styles.appTagline}>Save places. Share instantly.</Text>
              </View>
            </View>

            <Text style={styles.welcomeTitle}>{isSignup ? 'Rider sign up' : 'Rider login'}</Text>
            <Text style={styles.welcomeSubtitle}>
              {isSignup
                ? 'Enter your phone number to create your delivery account.'
                : 'Enter your phone number — we’ll send a one-time code.'}
            </Text>
          </View>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Phone number</Text>
          <TextInput
            value={phone}
            onChangeText={(text) => {
              setPhone(text);
              setErrorMessage('');
            }}
            style={[styles.input, hasError && styles.inputErrorBorder]}
            placeholder="03001234567"
            keyboardType="phone-pad"
            placeholderTextColor="#9ca3af"
            maxLength={15}
            editable={!loading}
          />
          <Text style={styles.helperText}>Pakistani mobile format (e.g. 03001234567)</Text>

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

          <Pressable
            style={[styles.continueButton, loading && styles.disabledButton]}
            onPress={handleRequestOTP}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.continueText}>Send OTP</Text>
            )}
          </Pressable>

          {isSignup ? (
            <Text style={styles.bottomText}>
              Already have an account?{' '}
              <Text
                style={styles.bottomLink}
                onPress={() =>
                  router.replace({ pathname: '/rider-login', params: { mode: 'login', accountType } })
                }>
                Sign in
              </Text>
            </Text>
          ) : (
            <Text style={styles.bottomText}>
              Don’t have an account?{' '}
              <Text style={styles.bottomLink} onPress={() => router.push('/register-select')}>
                Sign up
              </Text>
            </Text>
          )}
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
  container: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  hero: {
    borderRadius: 22,
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 22,
    backgroundColor: '#f5f7ff',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.10)',
  },
  heroContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  logoWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(17, 24, 39, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logo: {
    width: 28,
    height: 28,
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1d4ed8',
    letterSpacing: -0.2,
  },
  appTagline: {
    marginTop: 2,
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.4,
  },
  welcomeSubtitle: {
    marginTop: 8,
    fontSize: 15,
    color: '#475569',
    fontWeight: '600',
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 10,
  },
  input: {
    height: 54,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    fontSize: 16,
    color: '#111827',
  },
  inputErrorBorder: {
    borderColor: '#ef4444',
  },
  helperText: {
    marginTop: 8,
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  errorText: {
    marginTop: 12,
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600',
  },
  successText: {
    marginTop: 12,
    color: '#15803d',
    fontSize: 14,
    fontWeight: '600',
  },
  continueButton: {
    height: 54,
    borderRadius: 12,
    backgroundColor: '#5b86d6',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },
  continueText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.6,
  },
  bottomText: {
    marginTop: 20,
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 14,
  },
  bottomLink: {
    color: '#2f6fed',
    fontWeight: '700',
  },
});
