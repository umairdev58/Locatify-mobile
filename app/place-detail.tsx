import { Pressable, ScrollView, StyleSheet, View, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import EmbeddedMapPreview from '@/components/EmbeddedMapPreview';
import { openNavigationMaps } from '@/utils/openNavigationMaps';

export default function PlaceDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    name?: string;
    notes?: string;
    lat?: string;
    lng?: string;
    placeId?: string;
  }>();
  const latitude = Number(params.lat) || 31.5204;
  const longitude = Number(params.lng) || 74.3587;

  const handleNavigate = () => {
    openNavigationMaps(latitude, longitude);
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <FontAwesome name="chevron-left" size={20} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>Place Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Map Preview */}
        <View style={styles.mapPreview}>
          <EmbeddedMapPreview latitude={latitude} longitude={longitude} />
        </View>

        {/* Place Card */}
        <View style={styles.placeCard}>
          <View style={styles.placeCardHeader}>
            <Text style={styles.placeCardTitle}>{params.name || 'Untitled Place'}</Text>
          </View>

          {/* Notes Section */}
          {params.notes && (
            <View style={styles.infoSection}>
              <Text style={styles.infoSectionLabel}>NOTES</Text>
              <View style={styles.infoSectionBox}>
                <Text style={styles.infoSectionValue}>{params.notes}</Text>
              </View>
            </View>
          )}

          {/* GPS Coordinates Section */}
          <View style={styles.infoSection}>
            <Text style={styles.infoSectionLabel}>GPS COORDINATES</Text>
            <View style={styles.infoSectionBox}>
              <Text style={styles.coordinatesValue}>
                {latitude.toFixed(4)}, {longitude.toFixed(4)}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsRow}>
            <Pressable
              style={styles.startNavigationButton}
              onPress={handleNavigate}>
              <FontAwesome name="map" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.startNavigationButtonText}>Start Navigation</Text>
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
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
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
  placeCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 20,
  },
  placeCardHeader: {
    marginBottom: 20,
  },
  placeCardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
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
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    lineHeight: 22,
  },
  coordinatesValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3b82f6',
    fontFamily: 'monospace',
  },
  actionButtonsRow: {
    marginTop: 8,
    marginBottom: 16,
  },
  startNavigationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f97316',
    borderRadius: 12,
    paddingVertical: 14,
  },
  startNavigationButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});

