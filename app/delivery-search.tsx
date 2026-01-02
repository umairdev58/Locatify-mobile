import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { Linking, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';

import AccountGuard from '@/components/AccountGuard';
import { getAddressByCode } from '@/api/address';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

export default function DeliverySearchScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState<
    null | {
      _id: string;
      fullTextAddress: string;
      location: { latitude: number; longitude: number };
      publicCode: string;
      cardName: string;
      houseImages?: string[];
    }
  >(null);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!code.trim()) {
      setError('Enter a public code.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await getAddressByCode(code.trim());
      setAddress(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to fetch address';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const region: Region = address
    ? {
        latitude: address.location.latitude,
        longitude: address.location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : {
        latitude: 31.5204,
        longitude: 74.3587,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      };

  return (
    <AccountGuard required="delivery">
      <View style={[styles.screen, { backgroundColor: colorScheme === 'dark' ? '#030712' : '#f4f5ff' }]}>
      <Text style={[styles.title, { color: theme.text }]}>Lookup address</Text>
      <Text style={[styles.subtitle, { color: theme.tabIconDefault }]}>Enter the public code shared by the customer.</Text>
      <View style={styles.searchRow}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colorScheme === 'dark' ? '#0f162b' : '#fff',
              borderColor: colorScheme === 'dark' ? '#1f2951' : '#ccd5ff',
              color: theme.text,
            },
          ]}
          placeholder="Public code"
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
          placeholderTextColor={colorScheme === 'dark' ? '#94a3b8' : '#7185b2'}
        />
        <Pressable style={styles.searchButton} onPress={handleSearch} disabled={loading}>
          <Text style={styles.searchButtonText}>{loading ? 'Searching…' : 'Search'}</Text>
        </Pressable>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={[styles.mapContainer, { backgroundColor: colorScheme === 'dark' ? '#030712' : '#0b1021' }]}>
        <MapView provider={PROVIDER_GOOGLE} style={StyleSheet.absoluteFillObject} region={region}>
          {address && <Marker coordinate={address.location} />}
        </MapView>
      </View>
      {address && (
          <Pressable
            style={[
              styles.detailsCard,
              { backgroundColor: colorScheme === 'dark' ? '#111327' : '#fff' },
              { borderColor: colorScheme === 'dark' ? '#1f2951' : '#d2d6ff' },
            ]}
            onPress={() =>
              router.push({
                pathname: '/address-detail',
                params: {
                  address: address.fullTextAddress,
                  lat: address.location.latitude.toString(),
                  lng: address.location.longitude.toString(),
                  code: address.publicCode,
                  name: address.cardName,
                  addressId: address._id,
                  mode: 'delivery',
                  houseImages: JSON.stringify(address.houseImages ?? []),
                },
              })
            }>
            <Text style={[styles.detailLabel, { color: theme.tabIconDefault }]}>Card</Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>{address.cardName}</Text>
            <Text style={[styles.detailLabel, { color: theme.tabIconDefault }]}>Address</Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>{address.fullTextAddress}</Text>
            <Text style={[styles.detailLabel, { color: theme.tabIconDefault }]}>Code</Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>{address.publicCode}</Text>
            <Pressable
              style={[
                styles.navigationButton,
                { backgroundColor: colorScheme === 'dark' ? '#1f2940' : '#0f172a' },
              ]}
              onPress={() => {
                const { latitude, longitude } = address.location;
                const mapsUrl =
                  Platform.OS === 'ios'
                    ? `maps://?saddr=Current%20Location&daddr=${latitude},${longitude}`
                    : `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
                Linking.openURL(mapsUrl);
              }}>
              <View style={styles.navIcon}>
                <Text style={styles.navIconText}>➜</Text>
              </View>
              <Text style={[styles.directionText, { color: '#fff' }]}>Open navigation</Text>
              <Text style={styles.navHint}>Maps</Text>
            </Pressable>
          </Pressable>
      )}
      </View>
    </AccountGuard>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 24,
    backgroundColor: '#f4f5ff',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  searchRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  input: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ccd5ff',
    paddingHorizontal: 16,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  searchButton: {
    backgroundColor: '#5d5cff',
    borderRadius: 16,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  error: {
    color: '#dc2626',
    marginBottom: 8,
  },
  mapContainer: {
    height: 260,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#0b1021',
    marginVertical: 12,
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 16,
    elevation: 5,
    paddingBottom: 22,
  },
  detailLabel: {
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#6b7280',
    marginTop: 12,
  },
  detailValue: {
    fontSize: 16,
    color: '#111827',
    marginTop: 4,
  },
  directionButton: {
    marginTop: 16,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#5d5cff',
  },
  directionText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  directionTag: {
    backgroundColor: '#5d5cff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  directionTagText: {
    color: '#fff',
    fontWeight: '700',
  },
  navigationButton: {
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#5d5cff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#5d5cff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconText: {
    color: '#5d5cff',
    fontWeight: '700',
  },
  navHint: {
    color: '#94a3ff',
    fontSize: 12,
  },
});
