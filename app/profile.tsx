import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import AccountGuard from '@/components/AccountGuard';
import { getMyAddresses } from '@/api/address';
import { getMyPlaces } from '@/api/place';
import { getUserProfile, setAccountType, setAuthToken, setUserProfile } from '@/store/session';

export default function ProfileScreen() {
  const router = useRouter();
  const user = getUserProfile();
  const [addressCount, setAddressCount] = useState(0);
  const [placeCount, setPlaceCount] = useState(0);

  const userName = user?.name ?? 'Locatify User';
  const userEmail = user?.email ?? 'No email available';
  const initials = useMemo(() => {
    const parts = userName.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return 'LU';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }, [userName]);

  const refreshStats = useCallback(() => {
    let active = true;

    Promise.all([
      getMyAddresses().catch(() => []),
      getMyPlaces().catch(() => []),
    ]).then(([addresses, places]) => {
      if (!active) return;
      setAddressCount(Array.isArray(addresses) ? addresses.length : 0);
      setPlaceCount(Array.isArray(places) ? places.length : 0);
    });

    return () => {
      active = false;
    };
  }, []);

  useFocusEffect(refreshStats);

  const handleLogout = () => {
    setAuthToken(null);
    setAccountType(null);
    setUserProfile(null);
    router.replace('/login');
  };

  return (
    <AccountGuard required="user">
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={styles.heroTopRow}>
              <Pressable style={styles.backBtn} onPress={() => router.back()}>
                <FontAwesome name="chevron-left" size={16} color="#0f172a" />
              </Pressable>
              <Text style={styles.heroTitle}>Profile</Text>
              <View style={{ width: 34 }} />
            </View>

            <View style={styles.heroMain}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>

              <View style={styles.identity}>
                <Text style={styles.name} numberOfLines={1}>
                  {userName}
                </Text>
                <Text style={styles.email} numberOfLines={1}>
                  {userEmail}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{addressCount}</Text>
              <Text style={styles.statLabel}>Saved Addresses</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{placeCount}</Text>
              <Text style={styles.statLabel}>Pinned Places</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>

            <View style={styles.rowItem}>
              <View style={styles.rowLeft}>
                <FontAwesome name="user" size={16} color="#2563eb" />
                <Text style={styles.rowText}>Full Name</Text>
              </View>
              <Text style={styles.rowValue}>{userName}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.rowItem}>
              <View style={styles.rowLeft}>
                <FontAwesome name="envelope" size={14} color="#2563eb" />
                <Text style={styles.rowText}>Email</Text>
              </View>
              <Text style={styles.rowValue}>{userEmail}</Text>
            </View>
          </View>

          <Pressable style={styles.logoutBtn} onPress={handleLogout}>
            <FontAwesome name="sign-out" size={16} color="#ef4444" style={{ marginRight: 10 }} />
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </ScrollView>
      </View>
    </AccountGuard>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f7ff',
  },
  content: {
    padding: 18,
    paddingBottom: 30,
  },
  hero: {
    borderRadius: 22,
    padding: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.45)',
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 4,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  backBtn: {
    alignSelf: 'flex-start',
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.55)',
  },
  heroMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 74,
    height: 74,
    borderRadius: 22,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.22)',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  identity: {
    flex: 1,
    marginLeft: 14,
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  email: {
    fontSize: 14,
    color: '#64748b',
  },
  statsRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
  },
  statLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  section: {
    marginTop: 14,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
    color: '#64748b',
    marginBottom: 14,
    textTransform: 'uppercase',
  },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  rowValue: {
    fontSize: 14,
    color: '#334155',
    maxWidth: '52%',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 14,
  },
  logoutBtn: {
    marginTop: 16,
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ef4444',
  },
});

