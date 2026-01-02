import FontAwesome from '@expo/vector-icons/FontAwesome';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  useColorScheme,
  View,
  TouchableOpacity,
} from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';

import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { getMyAddresses, AddressResponse } from '@/api/address';

type Props = {};

export default function TabOneScreen({}: Props) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const [addresses, setAddresses] = useState<AddressResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const fetchAddress = useCallback(() => {
    let canceled = false;
    setLoading(true);
    setStatus(null);
    getMyAddresses()
      .then((result) => {
        if (canceled) return;
        setAddresses(result ?? []);
        if (!result || result.length === 0) {
          setStatus('No address saved yet.');
        }
      })
      .catch((error) => {
        if (canceled) return;
        setStatus(error instanceof Error ? error.message : 'Unable to load address.');
      })
      .finally(() => {
        if (!canceled) {
          setLoading(false);
        }
      });
    return () => {
      canceled = true;
    };
  }, []);

  useFocusEffect(fetchAddress);

  const handleAddAddress = () => {
    router.push('/add-address');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Saved location card</Text>
        <Text style={[styles.caption, { color: theme.tabIconDefault }]}>
          Keep your favorite delivery spot accessible.
        </Text>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={theme.tint} />
        </View>
      ) : addresses.length ? (
        <FlatList
          data={addresses}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          style={styles.list}
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                router.push({
                pathname: '/address-detail',
                params: {
                  address: item.fullTextAddress,
                  lat: item.location.latitude.toString(),
                  lng: item.location.longitude.toString(),
                  code: item.publicCode,
                  name: item.cardName,
                  addressId: item._id,
                      mode: 'user',
                      houseImages: JSON.stringify(item.houseImages ?? []),
                },
                })
              }
              style={[
                styles.addressCard,
                {
                  backgroundColor: colorScheme === 'dark' ? '#0f172a' : '#fff',
                  shadowOpacity: colorScheme === 'dark' ? 0.35 : 0.25,
                  elevation: colorScheme === 'dark' ? 8 : 5,
                },
              ]}>
            <Text style={styles.cardName}>{item.cardName || 'Location card'}</Text>
            <Text style={styles.addressLabel}>{item.fullTextAddress}</Text>
              <Text style={[styles.addressDescription, { color: theme.tabIconDefault }]}>
                Lat {item.location.latitude.toFixed(5)} · Lng {item.location.longitude.toFixed(5)}
              </Text>
              <Text style={[styles.publicCode, { color: theme.tint }]}>Code: {item.publicCode}</Text>
            </Pressable>
          )}
        />
      ) : (
        <Pressable
          style={[
            styles.emptyCard,
            {
              backgroundColor: colorScheme === 'dark' ? '#0b1122' : '#eef2ff',
              borderColor: colorScheme === 'dark' ? '#3b49b1' : '#94a3ff',
              shadowColor: colorScheme === 'dark' ? '#050813' : '#cbd5ff',
            },
          ]}
          onPress={handleAddAddress}>
          <FontAwesome name="plus" size={24} color={theme.tint} />
          <Text style={[styles.emptyText, { color: colorScheme === 'dark' ? '#f8fafc' : theme.text }]}>
            Add your first location
          </Text>
          <Text
            style={[
              styles.emptySubText,
              { color: colorScheme === 'dark' ? '#cbd5f5' : theme.tabIconDefault },
            ]}>
            Create a card with map coordinates and notes.
          </Text>
        </Pressable>
      )}

      {status ? (
        <Text style={[styles.statusText, { color: theme.tabIconDefault }]}>{status}</Text>
      ) : null}
      <TouchableOpacity style={styles.fab} onPress={handleAddAddress} activeOpacity={0.8}>
        <Text style={styles.fabText}>Add location</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  caption: {
    fontSize: 15,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  emptyCard: {
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    borderStyle: 'dotted',
    borderWidth: 1.2,
    borderColor: '#94a3ff',
    backgroundColor: '#eef2ff',
    marginTop: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: '700',
  },
  emptySubText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  list: {
    flex: 1,
  },
  addressCard: {
    borderRadius: 32,
    padding: 24,
    backgroundColor: '#0f172a',
    marginBottom: 16,
    shadowColor: '#0f172a',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 15 },
    shadowRadius: 25,
    elevation: 5,
  },
  addressLabel: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    color: '#f8fafc',
  },
  addressDescription: {
    fontSize: 15,
    marginBottom: 10,
    color: '#c7d2fe',
  },
  publicCode: {
    fontSize: 13,
    letterSpacing: 0.6,
    color: '#a5b4fc',
  },
  cardName: {
    fontSize: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#94a3ff',
    marginBottom: 6,
  },
  statusText: {
    marginTop: 12,
    fontSize: 12,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 40,
    backgroundColor: '#5d5cff',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 999,
    shadowColor: '#5d5cff',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 6,
  },
  fabText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
