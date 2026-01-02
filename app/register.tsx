// import { useRouter, useLocalSearchParams } from 'expo-router';
// import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
// import { useState } from 'react';

// import { Text } from '@/components/Themed';
// import { registerUser, RegisterPayload } from '@/api/auth';
// import { setAccountType, setAuthToken } from '@/store/session';

// export default function RegisterScreen() {
//   const router = useRouter();
//   const params = useLocalSearchParams<{ accountType?: RegisterPayload['accountType'] }>();
//   const [name, setName] = useState('');
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [accountType] = useState<RegisterPayload['accountType']>(params.accountType ?? 'user');
//   const [loading, setLoading] = useState(false);
//   const [errorMessage, setErrorMessage] = useState('');

//   const handleRegister = async () => {
//     if (!name || !email || !password) {
//       setErrorMessage('Complete every field.');
//       return;
//     }
//     setErrorMessage('');
//     setLoading(true);
//     try {
//       const { token, user } = await registerUser({ name, email, password, accountType });
//       setAuthToken(token);
//       setAccountType(user.accountType);
//       const destination = user.accountType === 'delivery' ? '/delivery-search' : '(tabs)';
//       router.replace(destination);
//     } catch (error) {
//       const message = error instanceof Error ? error.message : 'Unable to register';
//       setErrorMessage(message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <ScrollView
//       contentContainerStyle={styles.container}
//       keyboardShouldPersistTaps="handled"
//       showsVerticalScrollIndicator={false}>
//       <View style={styles.card}>
//         <Text style={styles.logo}>Locator</Text>
//         <Text style={styles.headline}>Create Your Account</Text>
//         <Text style={styles.subline}>Start saving beautiful address cards</Text>

//         <Text style={styles.label}>Full Name</Text>
//         <TextInput
//           value={name}
//           onChangeText={setName}
//           placeholder="John Doe"
//           placeholderTextColor="#b7bac7"
//           style={styles.input}
//         />

//         <Text style={styles.label}>Email Address</Text>
//         <TextInput
//           value={email}
//           onChangeText={setEmail}
//           placeholder="you@example.com"
//           keyboardType="email-address"
//           autoCapitalize="none"
//           placeholderTextColor="#b7bac7"
//           style={styles.input}
//         />

//         <Text style={styles.label}>Password</Text>
//         <TextInput
//           value={password}
//           onChangeText={setPassword}
//           placeholder="••••••••"
//           secureTextEntry
//           placeholderTextColor="#b7bac7"
//           style={styles.input}
//         />

//         {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

//         <Pressable style={[styles.cta, loading && styles.disabled]} onPress={handleRegister} disabled={loading}>
//           {loading ? <ActivityIndicator color="#111" /> : <Text style={styles.ctaText}>Create Account</Text>}
//         </Pressable>

//         <Text style={styles.footer}>
//           Already have an account?{' '}
//           <Text style={styles.signIn} onPress={() => router.replace('/login')}>
//             Sign In
//           </Text>
//         </Text>
//       </View>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flexGrow: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 24,
//     backgroundColor: '#f6f7f8',
//   },
//   card: {
//     width: '100%',
//     maxWidth: 520,
//     backgroundColor: '#fff',
//     borderRadius: 24,
//     padding: 32,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 20 },
//     shadowOpacity: 0.08,
//     shadowRadius: 30,
//     elevation: 10,
//   },
//   logo: {
//     fontSize: 32,
//     fontWeight: '700',
//     textAlign: 'center',
//     marginBottom: 8,
//   },
//   headline: {
//     fontSize: 28,
//     fontWeight: '700',
//     textAlign: 'center',
//   },
//   subline: {
//     marginTop: 8,
//     fontSize: 16,
//     color: '#6d7180',
//     textAlign: 'center',
//     marginBottom: 24,
//   },
//   label: {
//     fontSize: 12,
//     letterSpacing: 0.5,
//     color: '#6d7180',
//     marginBottom: 6,
//   },
//   input: {
//     borderRadius: 16,
//     height: 52,
//     paddingHorizontal: 20,
//     backgroundColor: '#f7f7fb',
//     borderWidth: 1,
//     borderColor: '#ececf1',
//     fontSize: 16,
//     marginBottom: 16,
//   },
//   errorText: {
//     color: '#b32621',
//     textAlign: 'center',
//     marginBottom: 12,
//   },
//   cta: {
//     borderRadius: 16,
//     backgroundColor: '#fff',
//     borderWidth: 1,
//     borderColor: '#d1d5df',
//     paddingVertical: 16,
//     alignItems: 'center',
//     marginTop: 12,
//   },
//   ctaText: {
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   disabled: {
//     opacity: 0.7,
//   },
//   footer: {
//     marginTop: 18,
//     textAlign: 'center',
//   },
//   signIn: {
//     color: '#1f4ede',
//     fontWeight: '600',
//   },
// });
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useState } from 'react';

import { Text } from '@/components/Themed';
import { registerUser, RegisterPayload } from '@/api/auth';
import { setAccountType, setAuthToken } from '@/store/session';

export default function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ accountType?: RegisterPayload['accountType'] }>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accountType] = useState<RegisterPayload['accountType']>(params.accountType ?? 'user');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setErrorMessage('Complete every field.');
      return;
    }
    setErrorMessage('');
    setLoading(true);
    try {
      const { token, user } = await registerUser({ name, email, password, accountType });
      setAuthToken(token);
      setAccountType(user.accountType);
      const destination = user.accountType === 'delivery' ? '/delivery-search' : '(tabs)';
      router.replace(destination);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to register';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <Text style={styles.logo}>Locator</Text>
        <Text style={styles.headline}>Create Your Account</Text>
        <Text style={styles.subline}>Start saving beautiful address cards</Text>

        <Text style={styles.label}>Full Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="John Doe"
          placeholderTextColor="#b7bac7"
          style={styles.input}
        />

        <Text style={styles.label}>Email Address</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#b7bac7"
          style={styles.input}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
          placeholderTextColor="#b7bac7"
          style={styles.input}
        />

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        <Pressable style={[styles.cta, loading && styles.disabled]} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#111" /> : <Text style={styles.ctaText}>Create Account</Text>}
        </Pressable>

        <Text style={styles.footer}>
          Already have an account?{' '}
          <Text style={styles.signIn} onPress={() => router.replace('/login')}>
            Sign In
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
    backgroundColor: '#f6f7f8',
  },
  card: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 10,
  },
  logo: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  headline: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  subline: {
    marginTop: 8,
    fontSize: 16,
    color: '#6d7180',
    textAlign: 'center',
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    letterSpacing: 0.5,
    color: '#6d7180',
    marginBottom: 6,
  },
  input: {
    borderRadius: 16,
    height: 52,
    paddingHorizontal: 20,
    backgroundColor: '#f7f7fb',
    borderWidth: 1,
    borderColor: '#ececf1',
    fontSize: 16,
    marginBottom: 16,
  },
  errorText: {
    color: '#b32621',
    textAlign: 'center',
    marginBottom: 12,
  },
  cta: {
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5df',
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.7,
  },
  footer: {
    marginTop: 18,
    textAlign: 'center',
  },
  signIn: {
    color: '#1f4ede',
    fontWeight: '600',
  },
});
