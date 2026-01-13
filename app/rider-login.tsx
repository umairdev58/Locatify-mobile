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
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { requestOTP } from '@/api/rider';

export default function RiderLoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; accountType?: string }>();
  const mode = params.mode || 'login'; // 'signup' or 'login'
  const accountType = params.accountType || 'rider';
  const isSignup = mode === 'signup';
  
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const buttonTint = themeColors.tint;
  const hasError = !!errorMessage;

  const handleRequestOTP = async () => {
    if (!phone || phone.trim().length === 0) {
      setErrorMessage('Please enter your phone number');
      return;
    }

    // Basic phone validation
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
      
      // Navigate to verify OTP screen after a short delay
      setTimeout(() => {
        router.push({
          pathname: '/rider-verify-otp',
          params: { phone: response.phone, mode, accountType },
        });
      }, 1000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to send OTP';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: '#f6f6f8' }]}
      keyboardShouldPersistTaps="handled">
      <View style={styles.lightBackground} />
      <View style={styles.lightBackgroundSmall} />
      <View style={styles.cardWrapper}>
        <Image source={require('../assets/images/icon.png')} style={styles.logo} />
        <Text style={styles.brand}>Locator</Text>
        <Text style={styles.subtitle}>
          {isSignup ? 'Rider Sign Up' : 'Rider Login'}
        </Text>
        <Text style={styles.tagline}>
          {isSignup 
            ? 'Enter your phone number to create your account' 
            : 'Enter your phone number to receive OTP'}
        </Text>

        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabel}>Phone Number</Text>
          <TextInput
            value={phone}
            onChangeText={(text) => {
              setPhone(text);
              setErrorMessage('');
            }}
            style={[styles.input, hasError && styles.inputError]}
            placeholder="03001234567"
            keyboardType="phone-pad"
            placeholderTextColor="#c3c5d2"
            maxLength={15}
            editable={!loading}
          />
          <Text style={styles.helperText}>
            Enter your Pakistani mobile number (e.g., 03001234567)
          </Text>
        </View>

        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}

        {successMessage ? (
          <Text style={styles.successText}>{successMessage}</Text>
        ) : null}

        <Pressable
          style={[styles.ctaButton, loading && styles.disabledButton]}
          onPress={handleRequestOTP}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.ctaText}>Send OTP</Text>
          )}
        </Pressable>

        {isSignup ? (
          <Text style={styles.noAccount}>
            Already have an account?{' '}
            <Text style={styles.signUp} onPress={() => router.push('/rider-login')}>
              Sign In
            </Text>
          </Text>
        ) : (
          <Text style={styles.noAccount}>
            Don't have an account?{' '}
            <Text style={styles.signUp} onPress={() => router.push('register-select')}>
              Sign Up
            </Text>
          </Text>
        )}
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
  logo: {
    width: 64,
    height: 64,
    marginBottom: 12,
  },
  brand: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 8,
  },
  tagline: {
    fontSize: 15,
    color: '#9aa2be',
    marginBottom: 20,
  },
  fieldWrapper: {
    width: '100%',
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 12,
    letterSpacing: 0.5,
    color: '#63697d',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    borderRadius: 16,
    height: 52,
    paddingHorizontal: 20,
    backgroundColor: '#f6f7fb',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ebecf2',
  },
  inputError: {
    borderColor: '#b32621',
  },
  helperText: {
    fontSize: 12,
    color: '#9aa2be',
    marginTop: 6,
  },
  errorText: {
    color: '#b32621',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    width: '100%',
    textAlign: 'center',
  },
  successText: {
    color: '#2e7d32',
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
  noAccount: {
    color: '#6f738a',
    fontSize: 14,
  },
  signUp: {
    color: '#1f4ede',
    fontWeight: '600',
  },
});

