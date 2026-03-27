import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View, Text } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

const roles = [
  {
    key: 'user',
    title: "I'm a User",
    description: 'Save addresses with beautiful cards & photos.',
    accent: '#eff6ff',
    icon: 'map-marker',
    iconColor: '#2563eb',
  },
  {
    key: 'delivery',
    title: "I'm a Delivery Rider",
    description: 'Sign up with phone number and OTP verification.',
    accent: '#eff6ff',
    icon: 'compass',
    iconColor: '#3b82f6',
    isOTP: true,
  },
  {
    key: 'rider',
    title: "I'm a Rider (OTP Login)",
    description: 'Quick login with phone number and OTP verification.',
    accent: '#eff6ff',
    icon: 'mobile-phone',
    iconColor: '#3b82f6',
    isOTP: true,
  },
];

export default function RegisterSelectScreen() {
  const router = useRouter();

  const handleSelect = (accountType: 'user' | 'delivery' | 'rider') => {
    if (accountType === 'rider' || accountType === 'delivery') {
      // Both rider and delivery use OTP verification for signup
      router.push({
        pathname: '/rider-login',
        params: { mode: 'signup', accountType },
      });
    } else {
      // Only regular users use email/password registration
      router.replace({
        pathname: '/register',
        params: { accountType },
      });
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.title}>Smart Address Management</Text>
          <Text style={styles.description}>
            Create detailed address cards with photos. Delivery riders find you easily with just a code.
          </Text>

          <View style={styles.optionStack}>
            {roles.map((role) => (
              <View key={role.key} style={styles.option}>
                <View style={[styles.iconWrapper, { backgroundColor: role.accent }]}>
                  <FontAwesome name={role.icon as any} size={24} color={role.iconColor} />
                </View>
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>{role.title}</Text>
                  <Text style={styles.optionDescription}>{role.description}</Text>
                  <Pressable 
                    style={styles.ctaButton}
                    onPress={() => handleSelect(role.key as 'user' | 'delivery' | 'rider')}>
                    <Text style={[styles.cta, (role as any).isOTP && styles.ctaOTP]}>
                      {(role as any).isOTP ? (role.key === 'delivery' ? 'Sign Up with OTP →' : 'Login with OTP →') : 'Get Started →'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Already have an account?{' '}
            </Text>
            <Pressable onPress={() => router.replace('/login')}>
              <Text style={styles.signIn}>Sign In</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    minHeight: '100%',
  },
  card: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#6b7280',
    lineHeight: 22,
    marginBottom: 32,
  },
  optionStack: {
    marginBottom: 32,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#fafafa',
    borderRadius: 16,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  optionDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  ctaButton: {
    alignSelf: 'flex-start',
  },
  cta: {
    fontSize: 15,
    color: '#2563eb',
    fontWeight: '700',
  },
  ctaOTP: {
    color: '#2563eb',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
  },
  signIn: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '700',
    marginLeft: 4,
  },
});

