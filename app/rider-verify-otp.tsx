import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  Alert,
} from 'react-native';
import { useState, useEffect, useRef } from 'react';

import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
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
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];
  
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Auto-focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setErrorMessage('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
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

      // Store rider token
      setRiderToken(response.token);

      // Show success and navigate
      Alert.alert(
        'Success',
        isSignup ? 'Account created successfully!' : 'OTP verified successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to delivery search or appropriate screen
              router.replace('/delivery-search');
            },
          },
        ]
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid OTP';
      setErrorMessage(message);

      // Extract remaining attempts from error message if available
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
      setResendCooldown(60); // 60 second cooldown
      Alert.alert('Success', 'OTP has been resent to your phone number');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to resend OTP';
      setErrorMessage(message);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: '#f6f6f8' }]}
      keyboardShouldPersistTaps="handled">
      <View style={styles.lightBackground} />
      <View style={styles.lightBackgroundSmall} />
      <View style={styles.cardWrapper}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>

        <Image source={require('../assets/images/icon.png')} style={styles.logo} />
        <Text style={styles.brand}>Verify OTP</Text>
        <Text style={styles.tagline}>
          Enter the 6-digit code sent to{'\n'}
          <Text style={styles.phoneText}>{phone}</Text>
        </Text>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              value={digit}
              onChangeText={(value) => handleOtpChange(index, value)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
              style={[styles.otpInput, errorMessage && styles.otpInputError]}
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
            {remainingAttempts !== null && ` (${remainingAttempts} attempts remaining)`}
          </Text>
        ) : null}

        <Pressable
          style={[styles.ctaButton, loading && styles.disabledButton]}
          onPress={() => handleVerifyOTP()}
          disabled={loading || otp.some((d) => !d)}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.ctaText}>Verify OTP</Text>
          )}
        </Pressable>

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive the code? </Text>
          <Pressable
            onPress={handleResendOTP}
            disabled={resendCooldown > 0 || resendLoading}>
            {resendLoading ? (
              <ActivityIndicator size="small" color="#1f4ede" />
            ) : (
              <Text style={[styles.resendButton, resendCooldown > 0 && styles.resendButtonDisabled]}>
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
              </Text>
            )}
          </Pressable>
        </View>

        <Pressable style={styles.changeNumberButton} onPress={() => router.back()}>
          <Text style={styles.changeNumberText}>Change phone number</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  lightBackground: {
    position: 'absolute',
    width: 320,
    height: 220,
    borderRadius: 120,
    backgroundColor: '#f5f6fb',
    top: -80,
    right: -60,
  },
  lightBackgroundSmall: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#eef0f8',
    bottom: -40,
    left: -20,
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    backgroundColor: '#fff',
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.08,
    shadowRadius: 35,
    elevation: 12,
    alignItems: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
    marginLeft: -8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#1f4ede',
    fontWeight: '600',
  },
  logo: {
    width: 64,
    height: 64,
    marginBottom: 12,
  },
  brand: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 8,
  },
  tagline: {
    fontSize: 15,
    color: '#9aa2be',
    marginTop: 8,
    marginBottom: 32,
    textAlign: 'center',
  },
  phoneText: {
    fontWeight: '600',
    color: '#1f4ede',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
    gap: 12,
  },
  otpInput: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ebecf2',
    backgroundColor: '#f6f7fb',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
  },
  otpInputError: {
    borderColor: '#b32621',
  },
  errorText: {
    color: '#b32621',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    width: '100%',
    textAlign: 'center',
  },
  ctaButton: {
    width: '100%',
    backgroundColor: '#1f4ede',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
    shadowColor: '#1f4ede',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 6,
  },
  ctaText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  resendText: {
    fontSize: 14,
    color: '#6f738a',
  },
  resendButton: {
    fontSize: 14,
    color: '#1f4ede',
    fontWeight: '600',
  },
  resendButtonDisabled: {
    color: '#9aa2be',
  },
  changeNumberButton: {
    paddingVertical: 8,
  },
  changeNumberText: {
    fontSize: 14,
    color: '#6f738a',
    textDecorationLine: 'underline',
  },
});

