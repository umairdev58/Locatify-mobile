import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  Image,
} from 'react-native';
import { useEffect, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as Google from 'expo-auth-session/providers/google';

import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { googleLogin, loginUser } from '@/api/auth';
import { setAccountType, setAuthToken, setUserProfile } from '@/store/session';

WebBrowser.maybeCompleteAuthSession();

/** Web OAuth redirect: must match Google Cloud "Web application" → Authorized redirect URIs exactly (incl. port). */
function getWebGoogleRedirectUri(): string {
  const fromEnv = (process as any)?.env?.EXPO_PUBLIC_GOOGLE_WEB_REDIRECT_URI as string | undefined;
  if (typeof fromEnv === 'string' && fromEnv.trim().length > 0) {
    return fromEnv.trim().replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    return AuthSession.makeRedirectUri({ path: '' });
  }
  return 'http://localhost:8081';
}

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme() ?? 'light';
  const [errorMessage, setErrorMessage] = useState('');
  const hasError = !!errorMessage;

  const googleClientId = (process as any)?.env?.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? '';
  const expoCfg = Constants.expoConfig;
  const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

  // Web: redirect is the page origin (e.g. http://localhost:8081) — register that exact URI in Google Cloud.
  // Expo Go: exp:// rejected by Google; use auth.expo.io proxy. Native builds: app scheme + /oauthredirect.
  const googleRedirectUri =
    Platform.OS === 'web'
      ? getWebGoogleRedirectUri()
      : isExpoGo
        ? (() => {
            try {
              return AuthSession.getRedirectUrl();
            } catch {
              const fullName =
                expoCfg?.originalFullName ??
                (expoCfg?.owner && expoCfg?.slug ? `@${expoCfg.owner}/${expoCfg.slug}` : '@mianumair22/locatify');
              return `https://auth.expo.io/${fullName}`;
            }
          })()
        : AuthSession.makeRedirectUri({
            scheme:
              (Array.isArray(expoCfg?.scheme) ? expoCfg.scheme[0] : expoCfg?.scheme) ?? 'mobile',
            path: 'oauthredirect',
          });

  if (__DEV__) {
    console.log('[Google OAuth] redirect_uri used for this platform:', googleRedirectUri);
    if (Platform.OS === 'web') {
      console.log(
        'Add in Google Cloud (same Web client as EXPO_PUBLIC_GOOGLE_CLIENT_ID): Authorized redirect URIs:',
        googleRedirectUri,
        '| Authorized JavaScript origins: same origin (e.g. http://localhost:8081)',
      );
    } else if (isExpoGo) {
      console.log('(Expo Go — auth.expo.io proxy can fail on “Proceed”; dev build is more reliable.)');
    }
  }

  const [googleRequest, googleResponse, promptGoogleLogin] = Google.useIdTokenAuthRequest({
    iosClientId: googleClientId,
    androidClientId: googleClientId,
    webClientId: googleClientId,
    redirectUri: googleRedirectUri,
  });

  const handleGoogleIdToken = async (idToken: string) => {
    setErrorMessage('');
    setLoading(true);
    try {
      const { token, user } = await googleLogin(idToken);
      setAuthToken(token);
      setAccountType(user.accountType);
      setUserProfile(user);
      router.replace(user.accountType === 'delivery' ? '/delivery-search' : '/(tabs)');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to login with Google';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (googleResponse?.type !== 'success') return;
    const maybeIdToken =
      (googleResponse as any)?.params?.id_token ||
      (googleResponse as any)?.authentication?.idToken ||
      '';

    if (maybeIdToken) {
      void handleGoogleIdToken(maybeIdToken);
    }
  }, [googleResponse]);

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
      setUserProfile(user);
      const destination = user.accountType === 'delivery' ? '/delivery-search' : '/(tabs)';
      router.replace(destination);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to login';
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
        keyboardShouldPersistTaps="handled">
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

            <Text style={styles.welcomeTitle}>Welcome back</Text>
            <Text style={styles.welcomeSubtitle}>
              Log in to access your saved locations and pins.
            </Text>
          </View>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Your Email</Text>
          <TextInput
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              if (errorMessage) setErrorMessage('');
            }}
            style={styles.input}
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor="#9ca3af"
            editable={!loading}
          />

          <Text style={[styles.label, { marginTop: 16 }]}>Password</Text>
          <View style={[styles.passwordWrap, hasError && styles.inputError]}>
            <TextInput
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                if (errorMessage) setErrorMessage('');
              }}
              style={styles.passwordInput}
              placeholder="••••••••"
              secureTextEntry={!passwordVisible}
              placeholderTextColor="#9ca3af"
              editable={!loading}
            />
            <Pressable
              style={styles.eyeButton}
              onPress={() => setPasswordVisible((v) => !v)}
              hitSlop={10}>
              <FontAwesome
                name={passwordVisible ? 'eye-slash' : 'eye'}
                size={18}
                color="#c7c7cc"
              />
            </Pressable>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.inlineError}>{hasError ? errorMessage : ' '}</Text>
            <Pressable onPress={() => router.push('/forgot-password')}>
              <Text style={styles.forgotLink}>Forgot password?</Text>
            </Pressable>
          </View>

          <Pressable
            style={[styles.continueButton, loading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.continueText}>Continue</Text>
            )}
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Or</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable
            style={styles.socialButton}
            onPress={() => {
              if (!googleClientId) {
                setErrorMessage('Google client ID is not configured.');
                return;
              }
              if (!googleRequest) return;
              promptGoogleLogin({
                preferEphemeralSession: false,
                ...(Platform.OS === 'android' ? { showInRecents: true } : {}),
              }).catch(() => {});
            }}>
            <FontAwesome name="google" size={16} color="#111827" style={styles.socialIcon} />
            <Text style={styles.socialText}>Login with Google</Text>
          </Pressable>

          <Text style={styles.bottomText}>
            Don’t have an account?{' '}
            <Text style={styles.bottomLink} onPress={() => router.push('/register-select')}>
              Sign up
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  disabledButton: {
    opacity: 0.6,
  },
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
  passwordWrap: {
    height: 54,
    borderRadius: 12,
    paddingLeft: 16,
    paddingRight: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingRight: 8,
  },
  eyeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 18,
  },
  inlineError: {
    color: '#c7c7cc',
    fontSize: 14,
  },
  forgotLink: {
    color: '#2f6fed',
    fontSize: 14,
    fontWeight: '600',
  },
  continueButton: {
    height: 54,
    borderRadius: 12,
    backgroundColor: '#5b86d6',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  continueText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 22,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#9ca3af',
    fontWeight: '600',
  },
  socialButton: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  socialIcon: {
    marginRight: 10,
  },
  socialText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  bottomText: {
    marginTop: 14,
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 14,
  },
  bottomLink: {
    color: '#2f6fed',
    fontWeight: '700',
  },
});
