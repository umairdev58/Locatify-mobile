import {
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';

import { Text } from '@/components/Themed';
import { getAddressByCode } from '@/api/address';

export default function AddressDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    address?: string;
    lat?: string;
    lng?: string;
    code?: string;
    name?: string;
    addressId?: string;
    mode?: 'user' | 'delivery';
    houseImages?: string;
  }>();
  const latitude = Number(params.lat) || 31.5204;
  const longitude = Number(params.lng) || 74.3587;
  const region: Region = {
    latitude,
    longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  const houseImages = (() => {
    if (!params.houseImages) return [];
    try {
      const parsed = JSON.parse(params.houseImages);
      if (Array.isArray(parsed)) {
        return parsed.filter((uri) => typeof uri === 'string');
      }
      return [];
    } catch {
      return [];
    }
  })();
  const [remoteHouseImages, setRemoteHouseImages] = useState<string[]>(houseImages);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!params.code) return;
    getAddressByCode(params.code)
      .then((data) => {
        if (cancelled) return;
        setRemoteHouseImages(data.houseImages ?? []);
      })
      .catch(() => {
        // ignore
      });
    return () => {
      cancelled = true;
    };
  }, [params.code]);

  const displayedHouseImages = useMemo(
    () => (remoteHouseImages.length ? remoteHouseImages : houseImages),
    [remoteHouseImages, houseImages],
  );

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Location Details</Text>
        <Text style={styles.subtitle}>Tap confirm to keep going.</Text>
      </View>
      <View style={styles.mapPreview}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFillObject}
          region={region}
          toolbarEnabled={false}>
          <Marker coordinate={{ latitude, longitude }} />
        </MapView>
      </View>
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Card name</Text>
        <Text style={[styles.sectionValue, styles.code]}>{params.name ?? 'Untitled'}</Text>
        <Text style={styles.sectionLabel}>Where</Text>
        <Text style={styles.sectionValue}>{params.address ?? 'Unknown location'}</Text>

        <Text style={styles.sectionLabel}>Coordinates</Text>
        <Text style={styles.sectionValue}>
          {params.lat ?? '0.000000'}, {params.lng ?? '0.000000'}
        </Text>

        <Text style={styles.sectionLabel}>Public code</Text>
        <Text style={[styles.sectionValue, styles.code]}>{params.code ?? '------'}</Text>
        {params.mode === 'delivery' && (
          <Pressable
            style={[styles.navigationButton, { backgroundColor: '#111827' }]}
            onPress={() => {
              const lat = Number(params.lat ?? 0);
              const lng = Number(params.lng ?? 0);
              const mapsUrl =
                Platform.OS === 'ios'
                  ? `maps://?saddr=Current%20Location&daddr=${lat},${lng}`
                  : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
              Linking.openURL(mapsUrl);
            }}>
            <View style={styles.navIcon}>
              <Text style={styles.navIconText}>➜</Text>
            </View>
            <Text style={[styles.directionText, { color: '#fff' }]}>Open navigation</Text>
            <Text style={styles.navHint}>Show route</Text>
          </Pressable>
        )}
          {displayedHouseImages.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>House photos</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageRow}>
                {displayedHouseImages.map((uri) => (
                  <TouchableOpacity key={uri} onPress={() => setPreviewImage(uri)}>
                    <Image key={uri} source={{ uri }} style={styles.houseImage} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
          </>
        )}
      </View>
      <View style={styles.footer}>
        {params.mode !== 'delivery' && (
          <Pressable
            style={styles.confirmButton}
            onPress={() =>
              router.push({
                pathname: '/add-address',
                params: {
                  address: params.address,
                  lat: params.lat,
                  lng: params.lng,
                  cardName: params.name,
                  addressId: params.addressId,
                },
              })
            }>
            <Text style={styles.confirmText}>Edit card</Text>
          </Pressable>
        )}
        <Pressable style={[styles.confirmButton, styles.closeAction]} onPress={() => router.back()}>
          <Text style={styles.confirmText}>Close</Text>
        </Pressable>
      </View>
      <Modal visible={!!previewImage} transparent animationType="fade">
        <View style={styles.previewOverlay}>
          <TouchableOpacity style={styles.previewContainer} onPress={() => setPreviewImage(null)}>
            {previewImage && <Image source={{ uri: previewImage }} style={styles.previewImage} />}
            <View style={styles.previewClose}>
              <Text style={styles.previewCloseText}>Close</Text>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#0b1021',
  },
  content: {
    padding: 24,
    backgroundColor: '#0b1021',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  subtitle: {
    color: '#9ca3af',
    marginTop: 6,
  },
  card: {
    backgroundColor: '#11152b',
    borderRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 16 },
    shadowRadius: 22,
    elevation: 8,
    flex: 1,
  },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 1,
    color: '#6b7280',
    textTransform: 'uppercase',
    marginTop: 16,
  },
  sectionValue: {
    fontSize: 18,
    color: '#fff',
    marginTop: 6,
  },
  code: {
    color: '#a5b4fc',
  },
  footer: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confirmButton: {
    backgroundColor: '#5d5cff',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
  },
  confirmText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  closeAction: {
    backgroundColor: '#1f2937',
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
  directionText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginRight: 8,
  },
  navHint: {
    color: '#94a3ff',
    fontSize: 12,
  },
  mapPreview: {
    height: 220,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
    backgroundColor: '#0a0c1a',
  },
  imageRow: {
    marginTop: 12,
  },
  houseImage: {
    width: 128,
    height: 96,
    borderRadius: 16,
    marginRight: 12,
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContainer: {
    width: '95%',
    maxHeight: '95%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  previewClose: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#fff',
  },
  previewCloseText: {
    color: '#fff',
    fontWeight: '600',
  },
});
