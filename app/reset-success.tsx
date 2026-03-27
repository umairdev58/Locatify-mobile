import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Text } from '@/components/Themed';

export default function ResetSuccessScreen() {
  const router = useRouter();

  return (
    <View style={styles.page}>
      <View style={styles.checkWrap}>
        <View style={styles.checkCircle}>
          <FontAwesome name="check" size={22} color="#5b86d6" />
        </View>
      </View>

      <View style={styles.sheet}>
        <Text style={styles.title}>Successful</Text>
        <Text style={styles.subtitle}>
          Congratulations! Your password has been changed. Click continue to login
        </Text>

        <Pressable style={styles.primaryButton} onPress={() => router.replace('/login')}>
          <Text style={styles.primaryButtonText}>Update Password</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'flex-end',
  },
  checkWrap: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  checkCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: 'rgba(91, 134, 214, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(91, 134, 214, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheet: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 26,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  title: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 13.5,
    color: '#9ca3af',
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 14,
  },
  primaryButton: {
    height: 50,
    borderRadius: 10,
    backgroundColor: '#5b86d6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});

