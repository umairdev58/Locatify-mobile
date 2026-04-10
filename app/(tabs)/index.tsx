import FontAwesome from '@expo/vector-icons/FontAwesome';
import {
  ActivityIndicator,
  FlatList,
  Share,
  Pressable,
  StyleSheet,
  useColorScheme,
  View,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';

import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useToast } from '@/components/ToastProvider';
import ConfirmationModal from '@/components/ConfirmationModal';
import AddressCardSkeleton from '@/components/AddressCardSkeleton';
import ShareWithLocatifyModal from '@/components/ShareWithLocatifyModal';
import { getMyAddresses, AddressResponse, deleteAddress } from '@/api/address';
import { useTabSearch } from '@/components/TabSearchContext';

type Props = {};

export default function TabOneScreen({}: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { showToast } = useToast();
  const { myLocQuery } = useTabSearch();
  const [addresses, setAddresses] = useState<AddressResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<AddressResponse | null>(null);
  const [shareModalItem, setShareModalItem] = useState<AddressResponse | null>(null);

  const ownedAddresses = addresses.filter((a) => !a.sharedFromUser);
  const addressCount = ownedAddresses.length;
  const addressCountText = `${addressCount} ${addressCount === 1 ? 'address' : 'addresses'} saved`;

  const normalizedQuery = myLocQuery.trim().toLowerCase();
  const filteredAddresses = normalizedQuery
    ? ownedAddresses.filter((a) => {
        const haystack = [
          a.cardName,
          a.fullTextAddress,
          a.landmark,
          a.notes,
          a.publicCode,
          `${a.location.latitude.toFixed(4)},${a.location.longitude.toFixed(4)}`,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(normalizedQuery);
      })
    : ownedAddresses;

  const fetchAddress = useCallback(() => {
    let canceled = false;
    setLoading(true);
    setStatus(null);
    getMyAddresses()
      .then((result) => {
        if (canceled) return;
        setAddresses(result ?? []);
        // No status text here; we show count + an empty-state card below.
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

  const handleCopyCode = async (code: string) => {
    try {
      await Clipboard.setStringAsync(code);
      showToast('Address code copied', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to copy code';
      showToast(message, 'error');
    }
  };

  const handleEdit = (item: AddressResponse) => {
    router.push({
      pathname: '/add-address',
      params: {
        address: item.fullTextAddress,
        landmark: item.landmark ?? '',
        notes: item.notes ?? '',
        lat: item.location.latitude.toString(),
        lng: item.location.longitude.toString(),
        cardName: item.cardName,
        addressId: item._id,
        publicCode: item.publicCode,
        houseImages: JSON.stringify(item.houseImages ?? []),
      },
    });
  };

  const handleShare = async (item: AddressResponse) => {
    const lat = item.location.latitude;
    const lng = item.location.longitude;
    // Lets people open the shared location immediately in maps.
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${lat},${lng}`
    )}`;

    const shareText = [
      'Locatify - Shared Location',
      '',
      item.cardName,
      item.fullTextAddress,
      '',
      `Address Code: ${item.publicCode}`,
      `Map: ${mapsUrl}`,
    ].join('\n');
    try {
      // Opens the native share sheet so users can pick social apps, messages, etc.
      await Share.share({
        title: 'Share location',
        message: shareText,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to share location';
      showToast(message, 'error');
    }
  };

  const handleDelete = (item: AddressResponse) => {
    setAddressToDelete(item);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!addressToDelete) return;
    
    setDeleteModalVisible(false);
    try {
      await deleteAddress(addressToDelete._id);
      fetchAddress();
      showToast('Address deleted successfully!', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to delete address';
      showToast(message, 'error');
    } finally {
      setAddressToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setAddressToDelete(null);
  };

  const fabBottom = 20 + insets.bottom;

  return (
    <View style={styles.root}>
      <View style={[styles.container, { backgroundColor: '#f5f5f5' }]}>
        <View style={styles.savedCountBar}>
        <FontAwesome name="bookmark" size={16} color="#2563eb" style={styles.savedCountIcon} />
        <Text style={styles.savedCountText}>
          {loading ? 'Loading addresses...' : addressCountText}
        </Text>
        </View>

      {loading ? (
        <FlatList
          data={[1, 2, 3]}
          keyExtractor={(item) => item.toString()}
          renderItem={() => <AddressCardSkeleton />}
          contentContainerStyle={styles.listContentPadded}
          showsVerticalScrollIndicator={false}
        />
      ) : filteredAddresses.length ? (
        <FlatList
          data={filteredAddresses}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          style={styles.list}
          contentContainerStyle={styles.listContentPadded}
          renderItem={({ item }) => {
            const bannerImage = item.houseImages?.[0] || null;
            const referencePhotos = item.houseImages?.slice(0, 2) || [];
            const lat = item.location.latitude;
            const lng = item.location.longitude;
            const latDir = lat >= 0 ? 'N' : 'S';
            const lngDir = lng >= 0 ? 'E' : 'W';
            
            return (
              <Pressable
                style={styles.addressCard}
                onPress={() => {
                  router.push({
                    pathname: '/address-detail',
                    params: {
                      address: item.fullTextAddress,
                      landmark: item.landmark ?? '',
                      notes: item.notes ?? '',
                      lat: item.location.latitude.toString(),
                      lng: item.location.longitude.toString(),
                      code: item.publicCode,
                      name: item.cardName,
                      addressId: item._id,
                      mode: 'user',
                      houseImages: JSON.stringify(item.houseImages ?? []),
                    },
                  });
                }}>
                {/* Banner Image with Overlay */}
                <View style={styles.bannerContainer}>
                  {bannerImage ? (
                    <Image source={{ uri: bannerImage }} style={styles.bannerImage} />
                  ) : (
                    <View style={[styles.bannerImage, styles.bannerPlaceholder]}>
                      <FontAwesome name="home" size={40} color="#9ca3af" />
                    </View>
                  )}
                  <View style={styles.bannerOverlay}>
                    <Text style={styles.bannerLocationName}>{item.cardName || 'Home'}</Text>
                  </View>
                </View>

                {/* Title + bookmark */}
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardTitleText}>{item.cardName || 'Untitled'}</Text>
                  <Pressable
                    style={styles.bookmarkButton}
                    onPress={() => {
                      // Bookmark/favorite can be wired later.
                    }}>
                    <FontAwesome name="bookmark" size={16} color="#2563eb" />
                  </Pressable>
                </View>

                {/* ADDRESS CODE + Address */}
                <View style={styles.riderCodeSection}>
                  <Text style={styles.sectionLabel}>ADDRESS CODE</Text>
                  <View style={styles.codePillRow}>
                    <Text style={styles.codePillText}>{item.publicCode}</Text>
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        handleCopyCode(item.publicCode);
                      }}
                      style={styles.copyButton}>
                      <FontAwesome name="copy" size={16} color="#3b82f6" />
                    </Pressable>
                  </View>
                  <Text style={styles.cardAddressLine} numberOfLines={1}>
                    {item.fullTextAddress}
                  </Text>
                </View>

                {/* Divider */}
                <View style={styles.cardDivider} />

                {/* COORDINATES (2 columns) */}
                <View style={styles.coordinatesSection}>
                  <View style={[styles.coordinateColumn, styles.coordinateColumnLeft]}>
                    <Text style={styles.coordinateLabel}>LATITUDE</Text>
                    <Text style={styles.coordinateValue}>
                      {Math.abs(lat).toFixed(4)} {latDir}
                    </Text>
                  </View>
                  <View style={styles.coordinateColumn}>
                    <Text style={styles.coordinateLabel}>LONGITUDE</Text>
                    <Text style={styles.coordinateValue}>
                      {Math.abs(lng).toFixed(4)} {lngDir}
                    </Text>
                  </View>
                </View>

                {/* REFERENCE PHOTOS Section */}
                {referencePhotos.length > 0 && (
                  <View style={styles.referencePhotosSection}>
                    <Text style={styles.sectionLabel}>
                      REFERENCE PHOTOS ({referencePhotos.length})
                    </Text>
                    <View style={styles.photosRow}>
                      {referencePhotos.map((photo, index) => (
                        <Image
                          key={`${photo}-${index}`}
                          source={{ uri: photo }}
                          style={styles.referencePhoto}
                        />
                      ))}
                    </View>
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <Pressable
                    style={[styles.actionButton, styles.editButton]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleEdit(item);
                    }}>
                    <FontAwesome name="pencil" size={16} color="#3b82f6" style={{ marginRight: 8 }} />
                    <Text style={[styles.actionButtonText, styles.editButtonText]}>Edit</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.actionButton, styles.shareButton]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleShare(item);
                    }}>
                    <FontAwesome name="share" size={16} color="#06b6d4" style={{ marginRight: 8 }} />
                    <Text style={[styles.actionButtonText, styles.shareButtonText]}>Share</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.actionButton, styles.deleteButton, { marginRight: 0 }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDelete(item);
                    }}>
                    <FontAwesome name="trash" size={16} color="#ef4444" style={{ marginRight: 8 }} />
                    <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
                  </Pressable>
                </View>
                <View style={styles.actionButtonsSecondRow}>
                  <Pressable
                    style={styles.shareLocatifyButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      setShareModalItem(item);
                    }}>
                    <FontAwesome name="users" size={16} color="#7c3aed" style={{ marginRight: 8 }} />
                    <Text style={styles.shareLocatifyButtonText}>Share with Locatify user</Text>
                  </Pressable>
                </View>
              </Pressable>
            );
          }}
        />
      ) : (
        <View style={styles.emptyCard}>
          <FontAwesome name="plus" size={24} color="#2563eb" />
          <Text style={[styles.emptyText, { color: '#1f2937' }]}>
            {normalizedQuery ? 'No matches found' : 'Add your first location'}
          </Text>
          <Text
            style={[
              styles.emptySubText,
              { color: '#6b7280' },
            ]}>
            {normalizedQuery
              ? 'Try a different search term.'
              : 'Tap the + button to create a card with map coordinates and notes.'}
          </Text>
        </View>
      )}

      {status ? (
        <Text style={styles.statusText}>{status}</Text>
      ) : null}
        </View>

      <Pressable
        style={[styles.fab, { bottom: fabBottom }]}
        onPress={handleAddAddress}
        accessibilityRole="button"
        accessibilityLabel="Add address">
        <FontAwesome name="plus" size={24} color="#ffffff" />
      </Pressable>

      <ConfirmationModal
        visible={deleteModalVisible}
        title="Delete Address"
        message={`Are you sure you want to delete "${addressToDelete?.cardName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonStyle="destructive"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      <ShareWithLocatifyModal
        visible={!!shareModalItem}
        addressId={shareModalItem?._id ?? null}
        cardLabel={shareModalItem?.cardName || 'Address'}
        onClose={() => setShareModalItem(null)}
        onShared={() => showToast('Share request sent', 'success')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOpacity: 0.22,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 10,
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
  listContentPadded: {
    flexGrow: 1,
    paddingBottom: 88,
  },
  savedCountBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 14,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  savedCountIcon: {
    marginRight: 10,
  },
  savedCountText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  addressCard: {
    borderRadius: 20,
    backgroundColor: '#fff',
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  bannerContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bannerPlaceholder: {
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    borderRadius: 999,
    alignItems: 'center',
  },
  bannerLocationName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  riderCodeSection: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  coordinatesSection: {
    paddingHorizontal: 16,
    paddingBottom: 18,
    flexDirection: 'row',
  },
  coordinateColumn: {
    flex: 1,
  },
  coordinateColumnLeft: {
    marginRight: 20,
  },
  coordinateLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  coordinateValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardTitleRow: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitleText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    flex: 1,
    marginRight: 12,
  },
  bookmarkButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codePillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
  },
  codePillText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2563eb',
  },
  copyButton: {
    padding: 6,
    borderRadius: 10,
  },
  cardAddressLine: {
    marginTop: 10,
    fontSize: 14,
    color: '#64748b',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginTop: 2,
  },
  referencePhotosSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3b82f6',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  // riderCodeRow / riderCodeText / coordinatesText are kept removed in favor of the new layout above.
  photosRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  referencePhoto: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
    marginRight: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 8,
  },
  actionButtonsSecondRow: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  shareLocatifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f3e8ff',
    borderWidth: 1,
    borderColor: '#e9d5ff',
  },
  shareLocatifyButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7c3aed',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginRight: 12,
  },
  editButton: {
    backgroundColor: '#e0f2fe',
  },
  shareButton: {
    backgroundColor: '#cffafe',
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  editButtonText: {
    color: '#3b82f6',
  },
  shareButtonText: {
    color: '#06b6d4',
  },
  deleteButtonText: {
    color: '#ef4444',
  },
  statusText: {
    marginTop: 12,
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
});
