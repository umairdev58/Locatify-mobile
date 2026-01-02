import { useRouter } from 'expo-router';
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
import { loginUser } from '@/api/auth';
import { setAccountType, setAuthToken } from '@/store/session';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const [errorMessage, setErrorMessage] = useState('');
  const buttonTint = themeColors.tint;
  const hasError = !!errorMessage;

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage('Enter both email and password to continue.');
      return;
    }

    if (!email.includes('@')) {
      setErrorMessage('Looks like that email is missing an "@" symbol.');
      return;
    }

    setErrorMessage('');
    setLoading(true);
    try {
      const { token, user } = await loginUser({ email, password });
      setAuthToken(token);
      setAccountType(user.accountType);
      const destination = user.accountType === 'delivery' ? '/delivery-search' : '(tabs)';
      router.replace(destination);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to login';
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
        <Text style={styles.subtitle}>Welcome Back</Text>
        <Text style={styles.tagline}>Sign in to your account</Text>

        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabel}>Email Address</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor="#c3c5d2"
          />
        </View>

        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabel}>Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              style={[styles.input, styles.passwordInput]}
              placeholder="••••••••"
              secureTextEntry
              placeholderTextColor="#c3c5d2"
            />
            <Pressable style={styles.forgotButton} onPress={() => router.push('login')}>
              <Text style={styles.forgotText}>Forgot?</Text>
            </Pressable>
          </View>
        </View>

        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}

        <Pressable
          style={[styles.ctaButton, loading && styles.disabledButton]}
          onPress={handleLogin}
          disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>Sign In</Text>}
        </Pressable>

        <Text style={styles.noAccount}>
          Don't have an account?{' '}
          <Text style={styles.signUp} onPress={() => router.push('register-select')}>
            Sign Up
          </Text>
        </Text>
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
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    marginRight: 8,
  },
  forgotButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  forgotText: {
    color: '#1f4ede',
    fontWeight: '600',
  },
  errorText: {
    color: '#b32621',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
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
