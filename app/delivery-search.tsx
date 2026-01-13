import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { Linking, Platform, Pressable, StyleSheet, Text, TextInput, View, Alert, ActivityIndicator, ScrollView, Image } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';

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
      <View style={styles.screen}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Find Location</Text>
          <View style={styles.headerIcons}>
            <Pressable style={styles.headerIconButton} onPress={() => Alert.alert('Quick Actions', 'Quick actions coming soon')}>
              <FontAwesome name="bolt" size={18} color="#6b7280" />
            </Pressable>
            <Pressable style={styles.headerIconButton} onPress={() => Alert.alert('Settings', 'Settings coming soon')}>
              <FontAwesome name="gear" size={18} color="#6b7280" />
            </Pressable>
            <Pressable style={styles.headerLogoutButton} onPress={() => router.replace('/login')}>
              <FontAwesome name="sign-out" size={16} color="#ef4444" />
            </Pressable>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, address && styles.searchBarFilled]}>
            <FontAwesome name="search" size={18} color={address ? "#f97316" : "#9ca3af"} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Enter address code (e.g., ADDR-ABC123)"
              value={code}
              onChangeText={setCode}
              autoCapitalize="characters"
              placeholderTextColor="#9ca3af"
            />
          </View>
          <Pressable style={styles.searchButton} onPress={handleSearch} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.searchButtonText}>Search Location</Text>
            )}
          </Pressable>
        </View>

        {/* Content */}
        {error ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <FontAwesome name="search" size={48} color="#9ca3af" />
            </View>
            <Text style={styles.emptyTitle}>No Address Found</Text>
            <Text style={styles.emptyText}>{error}</Text>
          </View>
        ) : !address ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <FontAwesome name="search" size={48} color="#9ca3af" />
            </View>
            <Text style={styles.emptyTitle}>No Address Found</Text>
            <Text style={styles.emptyText}>
              Enter the delivery address code from your assignment to view location details and reference photos.
            </Text>
          </View>
        ) : (
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            {/* Location Details Card */}
            <View style={styles.locationCard}>
              <View style={styles.locationCardHeader}>
                <Text style={styles.locationCardTitle}>{address.cardName || 'Location'}</Text>
                <View style={styles.locationFoundBadge}>
                  <Text style={styles.locationFoundBadgeText}>LOCATION FOUND</Text>
                </View>
              </View>

              {/* Delivery Address Section */}
              <View style={styles.infoSection}>
                <Text style={styles.infoSectionLabel}>DELIVERY ADDRESS</Text>
                <View style={styles.infoSectionBox}>
                  <Text style={styles.infoSectionValue}>{address.fullTextAddress}</Text>
                </View>
              </View>

              {/* GPS Coordinates Section */}
              <View style={styles.infoSection}>
                <Text style={styles.infoSectionLabel}>GPS COORDINATES</Text>
                <View style={styles.infoSectionBox}>
                  <Text style={styles.coordinatesValue}>
                    {address.location.latitude.toFixed(4)}, {address.location.longitude.toFixed(4)}
                  </Text>
                </View>
              </View>

              {/* Reference Photos Section */}
              {address.houseImages && address.houseImages.length > 0 && (
                <View style={styles.infoSection}>
                  <Text style={styles.infoSectionLabel}>
                    REFERENCE PHOTOS ({address.houseImages.length})
                  </Text>
                  <View style={styles.photosRow}>
                    {address.houseImages.slice(0, 2).map((imageUri, index) => (
                      <Image
                        key={`${imageUri}-${index}`}
                        source={{ uri: imageUri }}
                        style={[styles.referencePhoto, index === address.houseImages.slice(0, 2).length - 1 && { marginRight: 0 }]}
                      />
                    ))}
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actionButtonsRow}>
                <Pressable
                  style={styles.viewMapButton}
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
                  <Text style={styles.viewMapButtonText}>View Map</Text>
                </Pressable>
                <Pressable
                  style={styles.startNavigationButton}
                  onPress={() => {
                    const { latitude, longitude } = address.location;
                    const mapsUrl =
                      Platform.OS === 'ios'
                        ? `maps://?saddr=Current%20Location&daddr=${latitude},${longitude}`
                        : `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
                    Linking.openURL(mapsUrl);
                  }}>
                  <Text style={styles.startNavigationButtonText}>Start Navigation</Text>
                </Pressable>
              </View>

              {/* Tip Box */}
              <View style={styles.tipBox}>
                <Text style={styles.tipText}>
                  Tip: Take screenshots of the photos for reference during delivery.
                </Text>
              </View>
            </View>
          </ScrollView>
        )}
      </View>
    </AccountGuard>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  headerLogoutButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 12,
  },
  searchBarFilled: {
    borderColor: '#f97316',
    borderWidth: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  searchButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  locationCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
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
    backgroundColor: '#f97316',
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
    flexDirection: 'row',
    marginTop: 8,
  },
  referencePhoto: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
    marginRight: 12,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 16,
  },
  viewMapButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f97316',
    marginRight: 12,
  },
  viewMapButtonText: {
    color: '#f97316',
    fontSize: 15,
    fontWeight: '600',
  },
  startNavigationButton: {
    flex: 1,
    backgroundColor: '#f97316',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  startNavigationButtonText: {
    color: '#fff',
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
});
