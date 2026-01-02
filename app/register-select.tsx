import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/Themed';

const roles = [
  {
    key: 'user',
    title: "I'm a User",
    description: 'Save addresses with beautiful cards & photos.',
    accent: '#e2f0ff',
    icon: '📍',
  },
  {
    key: 'delivery',
    title: "I'm a Delivery Rider",
    description: 'Find locations & view details before navigation.',
    accent: '#ffe8df',
    icon: '🧭',
  },
];

export default function RegisterSelectScreen() {
  const router = useRouter();

  const handleSelect = (accountType: 'user' | 'delivery') => {
    router.replace({
      pathname: '/register',
      params: { accountType },
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.backer} />
      <View style={styles.card}>
        <Text style={styles.logo}>Locator</Text>
        <Text style={styles.tagline}>Smart Address Management</Text>
        <Text style={styles.headline}>Save & Share Locations</Text>
        <Text style={styles.subhead}>
          Create detailed address cards with photos. Delivery riders find you easily with just a code.
        </Text>

        <View style={styles.optionStack}>
          {roles.map((role) => (
            <View key={role.key} style={styles.option}>
              <View style={[styles.iconWrapper, { backgroundColor: role.accent }]}>
                <Text style={styles.icon}>{role.icon}</Text>
              </View>
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>{role.title}</Text>
                <Text style={styles.optionDescription}>{role.description}</Text>
                <Pressable onPress={() => handleSelect(role.key as 'user' | 'delivery')}>
                  <Text style={styles.cta}>Get Started →</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.footerText}>
          Already have an account?{' '}
          <Pressable onPress={() => router.replace('/login')}>
            <Text style={styles.signIn}>Sign In</Text>
          </Pressable>
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
  backer: {
    position: 'absolute',
    width: 320,
    height: 220,
    borderRadius: 120,
    backgroundColor: '#ededf6',
    top: -80,
    right: -60,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.08,
    shadowRadius: 32,
    elevation: 10,
  },
  logo: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 16,
    color: '#7b828c',
    marginBottom: 28,
  },
  headline: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 12,
  },
  subhead: {
    fontSize: 16,
    color: '#6d7180',
    marginBottom: 32,
  },
  optionStack: {
    marginBottom: 36,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    padding: 12,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  icon: {
    fontSize: 24,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#6d7180',
    marginBottom: 8,
  },
  cta: {
    fontSize: 15,
    color: '#ff5c1f',
    fontWeight: '700',
  },
  footerText: {
    fontSize: 14,
    color: '#6d7180',
    textAlign: 'center',
  },
  signIn: {
    color: '#1f4ede',
    fontWeight: '700',
  },
});

