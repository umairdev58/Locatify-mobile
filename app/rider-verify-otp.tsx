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
  Alert,
} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Text } from '@/components/Themed';
import { verifyOTP, requestOTP } from '@/api/rider';
import { setRiderToken } from '@/store/session';

export default function RiderVerifyOTPScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string; mode?: string; accountType?: string }>();
  const phone = params.phone || '';
  const mode = params.mode || 'login';
  const isSignup = mode === 'signup';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setErrorMessage('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every((digit) => digit !== '') && index === 5) {
      handleVerifyOTP(newOtp.join(''));
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (otpValue?: string) => {
    const otpString = otpValue || otp.join('');

    if (otpString.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit OTP');
      return;
    }

    if (!phone) {
      setErrorMessage('Phone number is missing');
      return;
    }

    setErrorMessage('');
    setLoading(true);

    try {
      const response = await verifyOTP({
        phone,
        otp: otpString,
      });

      setRiderToken(response.token);

      Alert.alert(
        'Success',
        isSignup ? 'Account created successfully!' : 'You’re signed in.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/delivery-search'),
          },
        ],
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid OTP';
      setErrorMessage(message);

      if (message.includes('remainingAttempts')) {
        const match = message.match(/(\d+)/);
        if (match) {
          setRemainingAttempts(parseInt(match[1], 10));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0 || !phone) {
      return;
    }

    setResendLoading(true);
    setErrorMessage('');

    try {
      await requestOTP({ phone });
      setResendCooldown(60);
      Alert.alert('Sent', 'A new code was sent to your phone.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to resend OTP';
      setErrorMessage(message);
    } finally {
      setResendLoading(false);
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
        <Pressable style={styles.backRow} onPress={() => router.back()} hitSlop={12}>
          <FontAwesome name="chevron-left" size={18} color="#2563eb" />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

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
                <Text style={styles.appTagline}>Verify your phone</Text>
              </View>
            </View>

            <Text style={styles.welcomeTitle}>Enter code</Text>
            <Text style={styles.welcomeSubtitle}>
              6-digit code sent to{' '}
              <Text style={styles.phoneInline}>{phone}</Text>
            </Text>
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.otpRow}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                value={digit}
                onChangeText={(value) => handleOtpChange(index, value)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
                style={[styles.otpInput, errorMessage ? styles.otpInputError : null]}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                editable={!loading}
              />
            ))}
          </View>

          {errorMessage ? (
            <Text style={styles.errorText}>
              {errorMessage}
              {remainingAttempts !== null ? ` (${remainingAttempts} attempts left)` : ''}
            </Text>
          ) : null}

          <Pressable
            style={[styles.continueButton, (loading || otp.some((d) => !d)) && styles.disabledButton]}
            onPress={() => handleVerifyOTP()}
            disabled={loading || otp.some((d) => !d)}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.continueText}>Verify</Text>
            )}
          </Pressable>

          <View style={styles.resendRow}>
            <Text style={styles.resendLabel}>Didn’t get a code? </Text>
            <Pressable onPress={handleResendOTP} disabled={resendCooldown > 0 || resendLoading}>
              {resendLoading ? (
                <ActivityIndicator size="small" color="#2f6fed" />
              ) : (
                <Text style={[styles.resendLink, resendCooldown > 0 && styles.resendMuted]}>
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                </Text>
              )}
            </Pressable>
          </View>

          <Pressable onPress={() => router.back()}>
            <Text style={styles.changeNumber}>Change phone number</Text>
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
  container: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    alignSelf: 'flex-start',
    gap: 6,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
  },
  hero: {
    borderRadius: 22,
    overflow: 'hidden',
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
  phoneInline: {
    color: '#1d4ed8',
    fontWeight: '700',
  },
  form: {
    width: '100%',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  otpInput: {
    flex: 1,
    minWidth: 0,
    height: 54,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  otpInputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  continueButton: {
    height: 54,
    borderRadius: 12,
    backgroundColor: '#5b86d6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.6,
  },
  resendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    marginBottom: 12,
  },
  resendLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  resendLink: {
    fontSize: 14,
    color: '#2f6fed',
    fontWeight: '700',
  },
  resendMuted: {
    color: '#94a3b8',
  },
  changeNumber: {
    fontSize: 14,
    color: '#2f6fed',
    fontWeight: '600',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});
