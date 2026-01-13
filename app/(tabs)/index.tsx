import FontAwesome from '@expo/vector-icons/FontAwesome';
import {
  ActivityIndicator,
  FlatList,
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
import * as Clipboard from 'expo-clipboard';

import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useToast } from '@/components/ToastProvider';
import ConfirmationModal from '@/components/ConfirmationModal';
import AddressCardSkeleton from '@/components/AddressCardSkeleton';
import { getMyAddresses, AddressResponse, deleteAddress } from '@/api/address';

type Props = {};

export default function TabOneScreen({}: Props) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { showToast } = useToast();
  const [addresses, setAddresses] = useState<AddressResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<AddressResponse | null>(null);

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

  const handleCopyCode = async (code: string) => {
    await Clipboard.setStringAsync(code);
    Alert.alert('Copied!', 'Address code copied to clipboard');
  };

  const handleEdit = (item: AddressResponse) => {
    router.push({
      pathname: '/add-address',
      params: {
        address: item.fullTextAddress,
        lat: item.location.latitude.toString(),
        lng: item.location.longitude.toString(),
        cardName: item.cardName,
        addressId: item._id,
      },
    });
  };

  const handleShare = async (item: AddressResponse) => {
    const shareText = `${item.cardName}\n${item.fullTextAddress}\nCode: ${item.publicCode}`;
    await Clipboard.setStringAsync(shareText);
    Alert.alert('Copied!', 'Location details copied to clipboard');
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

  return (
    <View style={[styles.container, { backgroundColor: '#f5f5f5' }]}>
      {loading ? (
        <FlatList
          data={[1, 2, 3]}
          keyExtractor={(item) => item.toString()}
          renderItem={() => <AddressCardSkeleton />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      ) : addresses.length ? (
        <FlatList
          data={addresses}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          style={styles.list}
          renderItem={({ item }) => {
            const bannerImage = item.houseImages?.[0] || null;
            const referencePhotos = item.houseImages?.slice(0, 2) || [];
            
            return (
              <View style={styles.addressCard}>
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
                    <View style={styles.bannerAddressRow}>
                      <FontAwesome name="map-marker" size={12} color="#fff" style={{ marginRight: 6 }} />
                      <Text style={styles.bannerAddress}>{item.fullTextAddress}</Text>
                    </View>
                  </View>
                </View>

                {/* ADDRESS CODE Section */}
                <View style={styles.riderCodeSection}>
                  <Text style={styles.sectionLabel}>ADDRESS CODE</Text>
                  <View style={styles.riderCodeRow}>
                    <Text style={styles.riderCodeText}>{item.publicCode}</Text>
                    <Pressable
                      onPress={() => handleCopyCode(item.publicCode)}
                      style={styles.copyButton}>
                      <FontAwesome name="copy" size={16} color="#3b82f6" />
                    </Pressable>
                  </View>
                </View>

                {/* COORDINATES Section */}
                <View style={styles.coordinatesSection}>
                  <Text style={styles.sectionLabel}>COORDINATES</Text>
                  <Text style={styles.coordinatesText}>
                    {item.location.latitude.toFixed(4)}, {item.location.longitude.toFixed(4)}
                  </Text>
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
                    onPress={() => handleEdit(item)}>
                    <FontAwesome name="pencil" size={16} color="#3b82f6" style={{ marginRight: 8 }} />
                    <Text style={[styles.actionButtonText, styles.editButtonText]}>Edit</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.actionButton, styles.shareButton]}
                    onPress={() => handleShare(item)}>
                    <FontAwesome name="share" size={16} color="#06b6d4" style={{ marginRight: 8 }} />
                    <Text style={[styles.actionButtonText, styles.shareButtonText]}>Share</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.actionButton, styles.deleteButton, { marginRight: 0 }]}
                    onPress={() => handleDelete(item)}>
                    <FontAwesome name="trash" size={16} color="#ef4444" style={{ marginRight: 8 }} />
                    <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            );
          }}
          ListFooterComponent={
            <Pressable style={styles.addAddressButton} onPress={handleAddAddress}>
              <Text style={styles.addAddressButtonText}>Add Address</Text>
            </Pressable>
          }
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
        <Text style={styles.statusText}>{status}</Text>
      ) : null}

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
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
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  bannerLocationName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  bannerAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerAddress: {
    fontSize: 14,
    color: '#fff',
    flex: 1,
  },
  riderCodeSection: {
    backgroundColor: '#e0f2fe',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  coordinatesSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
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
  riderCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  riderCodeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3b82f6',
    flex: 1,
  },
  copyButton: {
    padding: 8,
  },
  coordinatesText: {
    fontSize: 16,
    color: '#1f2937',
  },
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
  addAddressButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  addAddressButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
