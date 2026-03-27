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
  Text,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { getAddressByCode } from '@/api/address';
import EmbeddedMapPreview from '@/components/EmbeddedMapPreview';

export default function AddressDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    address?: string;
    landmark?: string;
    notes?: string;
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
  const [landmarkText, setLandmarkText] = useState(params.landmark ?? '');
  const [notesText, setNotesText] = useState(params.notes ?? '');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!params.code) return;
    getAddressByCode(params.code)
      .then((data) => {
        if (cancelled) return;
        setRemoteHouseImages(data.houseImages ?? []);
        if (typeof data.landmark === 'string') setLandmarkText(data.landmark);
        if (typeof data.notes === 'string') setNotesText(data.notes);
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

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    if (params.mode === 'delivery') {
      router.replace('/delivery-search');
      return;
    }
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable
          onPress={handleBack}
          style={styles.backButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <FontAwesome name="chevron-left" size={20} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>Location Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Map Preview */}
        <View style={styles.mapPreview}>
          <EmbeddedMapPreview latitude={latitude} longitude={longitude} />
        </View>

        {/* Location Card */}
        <View style={styles.locationCard}>
          <View style={styles.locationCardHeader}>
            <Text style={styles.locationCardTitle}>{params.name ?? 'Untitled'}</Text>
            {params.mode === 'delivery' && (
              <View style={styles.locationFoundBadge}>
                <Text style={styles.locationFoundBadgeText}>LOCATION FOUND</Text>
              </View>
            )}
          </View>

          {/* Delivery Address Section */}
          <View style={styles.infoSection}>
            <Text style={styles.infoSectionLabel}>DELIVERY ADDRESS</Text>
            <View style={styles.infoSectionBox}>
              <Text style={styles.infoSectionValue}>{params.address ?? 'Unknown location'}</Text>
            </View>
          </View>

          {landmarkText.trim() ? (
            <View style={styles.infoSection}>
              <Text style={styles.infoSectionLabel}>LANDMARK</Text>
              <View style={styles.infoSectionBox}>
                <Text style={styles.infoSectionValue}>{landmarkText.trim()}</Text>
              </View>
            </View>
          ) : null}

          {notesText.trim() ? (
            <View style={styles.infoSection}>
              <Text style={styles.infoSectionLabel}>NOTES</Text>
              <View style={styles.infoSectionBox}>
                <Text style={styles.infoSectionValue}>{notesText.trim()}</Text>
              </View>
            </View>
          ) : null}

          {/* GPS Coordinates Section */}
          <View style={styles.infoSection}>
            <Text style={styles.infoSectionLabel}>GPS COORDINATES</Text>
            <View style={styles.infoSectionBox}>
              <Text style={styles.coordinatesValue}>
                {params.lat ? Number(params.lat).toFixed(4) : '0.0000'}, {params.lng ? Number(params.lng).toFixed(4) : '0.0000'}
              </Text>
            </View>
          </View>

          {/* Reference Photos Section */}
          {displayedHouseImages.length > 0 && (
            <View style={styles.infoSection}>
              <Text style={styles.infoSectionLabel}>
                REFERENCE PHOTOS ({displayedHouseImages.length})
              </Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.photosRow}
                contentContainerStyle={styles.photosRowContent}>
                {displayedHouseImages.map((uri, index) => (
                  <TouchableOpacity 
                    key={uri} 
                    onPress={() => setPreviewImage(uri)}
                    style={[styles.referencePhotoContainer, index === displayedHouseImages.length - 1 && { marginRight: 0 }]}>
                    <Image source={{ uri }} style={styles.referencePhoto} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Action Buttons */}
          {params.mode === 'delivery' ? (
            <View style={styles.actionButtonsRow}>
              <Pressable
                style={styles.startNavigationButtonFull}
                onPress={() => {
                  const lat = Number(params.lat ?? 0);
                  const lng = Number(params.lng ?? 0);
                  const mapsUrl =
                    Platform.OS === 'ios'
                      ? `maps://?saddr=Current%20Location&daddr=${lat},${lng}`
                      : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
                  Linking.openURL(mapsUrl);
                }}>
                <Text style={styles.startNavigationButtonText}>Start Navigation</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.actionButtonsRow}>
              <Pressable
                style={styles.editButton}
                onPress={() =>
                  router.push({
                    pathname: '/add-address',
                    params: {
                      address: params.address,
                      landmark: landmarkText,
                      notes: notesText,
                      lat: params.lat,
                      lng: params.lng,
                      cardName: params.name,
                      addressId: params.addressId,
                      publicCode: params.code ?? '',
                      houseImages: JSON.stringify(displayedHouseImages),
                    },
                  })
                }>
                <FontAwesome name="pencil" size={16} color="#3b82f6" style={{ marginRight: 8 }} />
                <Text style={styles.editButtonText}>Edit</Text>
              </Pressable>
              <Pressable style={styles.closeButton} onPress={() => router.back()}>
                <Text style={styles.closeButtonText}>Close</Text>
              </Pressable>
            </View>
          )}

          {/* Tip Box for Delivery Mode */}
          {params.mode === 'delivery' && (
            <View style={styles.tipBox}>
              <Text style={styles.tipText}>
                Tip: Take screenshots of the photos for reference during delivery.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  headerSpacer: {
    width: 36,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  mapPreview: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  locationCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 20,
  },
  locationCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  locationCardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  locationFoundBadge: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  locationFoundBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  infoSection: {
    marginBottom: 20,
  },
  infoSectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  infoSectionBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  infoSectionValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  coordinatesValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3b82f6',
  },
  photosRow: {
    marginTop: 8,
  },
  photosRowContent: {
    paddingRight: 20,
  },
  referencePhotoContainer: {
    marginRight: 12,
  },
  referencePhoto: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 16,
  },
  startNavigationButtonFull: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  startNavigationButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e0f2fe',
    borderRadius: 12,
    paddingVertical: 14,
    marginRight: 12,
  },
  editButtonText: {
    color: '#3b82f6',
    fontSize: 15,
    fontWeight: '600',
  },
  closeButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#6b7280',
    fontSize: 15,
    fontWeight: '600',
  },
  tipBox: {
    backgroundColor: '#e0f2fe',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  tipText: {
    fontSize: 13,
    color: '#0369a1',
    lineHeight: 18,
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
