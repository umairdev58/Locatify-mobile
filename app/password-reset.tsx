import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Text } from '@/components/Themed';

export default function PasswordResetInfoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; code?: string }>();
  const email = (params.email ?? '').toString();
  const code = (params.code ?? '').toString();

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={10}>
          <FontAwesome name="chevron-left" size={18} color="#111827" />
        </Pressable>

        <Text style={styles.title}>Password reset</Text>
        <Text style={styles.subtitle}>
          Your password has been successfully reset, click confirm to set a new password
        </Text>

        <Pressable
          style={styles.primaryButton}
          onPress={() =>
            router.push({
              pathname: '/set-new-password',
              params: { email, code },
            })
          }>
          <Text style={styles.primaryButtonText}>Confirm</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#ffffff',
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
  primaryButton: {
    height: 54,
    borderRadius: 12,
    backgroundColor: '#5b86d6',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
});

