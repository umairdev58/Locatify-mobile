import FontAwesome from '@expo/vector-icons/FontAwesome';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  useColorScheme,
  View,
  ScrollView,
} from 'react-native';
import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useToast } from '@/components/ToastProvider';
import ConfirmationModal from '@/components/ConfirmationModal';
import PlaceCardSkeleton from '@/components/PlaceCardSkeleton';
import { getMyPlaces, PlaceResponse, deletePlace } from '@/api/place';
import { useTabSearch } from '@/components/TabSearchContext';
import { openNavigationMaps } from '@/utils/openNavigationMaps';

type Props = {};

export default function TabTwoScreen({}: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { showToast } = useToast();
  const { pinLocQuery } = useTabSearch();
  const [places, setPlaces] = useState<PlaceResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [placeToDelete, setPlaceToDelete] = useState<PlaceResponse | null>(null);

  const normalizedQuery = pinLocQuery.trim().toLowerCase();
  const filteredPlaces = useMemo(() => {
    if (!normalizedQuery) return places;
    return places.filter((p) => {
      const haystack = [
        p.name,
        p.notes,
        `${p.location.latitude.toFixed(4)},${p.location.longitude.toFixed(4)}`,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [places, normalizedQuery]);

  const fetchPlaces = useCallback(() => {
    let canceled = false;
    setLoading(true);
    setStatus(null);
    getMyPlaces()
      .then((result) => {
        if (canceled) return;
        setPlaces(result ?? []);
        if (!result || result.length === 0) {
          setStatus('No places saved yet.');
        }
      })
      .catch((error) => {
        if (canceled) return;
        setStatus(error instanceof Error ? error.message : 'Unable to load places.');
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

  useFocusEffect(fetchPlaces);

  const handleAddPlace = () => {
    router.push('/add-place');
  };

  const handleEdit = (item: PlaceResponse) => {
    router.push({
      pathname: '/add-place',
      params: {
        name: item.name,
        notes: item.notes,
        lat: item.location.latitude.toString(),
        lng: item.location.longitude.toString(),
        placeId: item._id,
      },
    });
  };

  const handleNavigate = (item: PlaceResponse) => {
    router.push({
      pathname: '/place-detail',
      params: {
        name: item.name,
        notes: item.notes,
        lat: item.location.latitude.toString(),
        lng: item.location.longitude.toString(),
        placeId: item._id,
      },
    });
  };

  const handleNavigateToMaps = (item: PlaceResponse, e: any) => {
    e.stopPropagation();
    const { latitude, longitude } = item.location;
    openNavigationMaps(latitude, longitude);
  };

  const handleDelete = (item: PlaceResponse) => {
    setPlaceToDelete(item);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!placeToDelete) return;
    
    setDeleteModalVisible(false);
    try {
      await deletePlace(placeToDelete._id);
      fetchPlaces();
      showToast('Place deleted successfully!', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to delete place';
      showToast(message, 'error');
    } finally {
      setPlaceToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setPlaceToDelete(null);
  };

  const fabBottom = 20 + insets.bottom;

  const renderAddFab = () => (
    <Pressable
      style={[styles.fab, { bottom: fabBottom }]}
      onPress={handleAddPlace}
      accessibilityRole="button"
      accessibilityLabel="Add place">
      <FontAwesome name="plus" size={24} color="#ffffff" />
    </Pressable>
  );

  const renderItem = ({ item }: { item: PlaceResponse }) => {
    return (
      <View style={styles.placeCard}>
        {/* Orange Header */}
        <View style={styles.cardHeader}>
          <Text style={styles.cardHeaderTitle}>{item.name}</Text>
          <View style={styles.cardHeaderAddress}>
            <FontAwesome name="map-marker" size={14} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.cardHeaderAddressText}>
              {item.location.latitude.toFixed(4)}, {item.location.longitude.toFixed(4)}
            </Text>
          </View>
        </View>

        {/* Card Content */}
        <View style={styles.cardContent}>
          {/* Notes Section */}
          {item.notes && (
            <View style={styles.infoSection}>
              <Text style={styles.infoSectionLabel}>NOTES</Text>
              <View style={styles.notesBox}>
                <Text style={styles.notesText}>{item.notes}</Text>
              </View>
            </View>
          )}

          {/* Coordinates Section */}
          <View style={styles.infoSection}>
            <Text style={styles.coordinatesLabel}>COORDINATES</Text>
            <View style={styles.coordinatesBox}>
              <Text style={styles.coordinatesText}>
                {item.location.latitude.toFixed(4)}, {item.location.longitude.toFixed(4)}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsRow}>
            <Pressable
              style={styles.navigateButton}
              onPress={(e) => handleNavigateToMaps(item, e)}>
              <FontAwesome name="paper-plane" size={16} color="#2563eb" style={{ marginRight: 8 }} />
              <Text style={styles.navigateButtonText}>Navigate</Text>
            </Pressable>
            <Pressable
              style={styles.removeButton}
              onPress={(e) => {
                e.stopPropagation();
                handleDelete(item);
              }}>
              <FontAwesome name="trash" size={16} color="#ef4444" style={{ marginRight: 8 }} />
              <Text style={styles.removeButtonText}>Remove</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.screen}>
        <FlatList
          data={[1, 2, 3]}
          keyExtractor={(item) => item.toString()}
          renderItem={() => <PlaceCardSkeleton />}
          contentContainerStyle={styles.listContentPadded}
          showsVerticalScrollIndicator={false}
        />
        {renderAddFab()}
      </View>
    );
  }

  if (status && places.length === 0) {
    return (
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.emptyContainer}>
          <FontAwesome name="map-pin" size={64} color="#d1d5db" />
          <Text style={styles.emptyText}>{status}</Text>
          <Text style={styles.emptyHint}>Tap + to pin your first place.</Text>
        </ScrollView>
        {renderAddFab()}
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={filteredPlaces}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContentPadded}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FontAwesome name="map-pin" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>
              {normalizedQuery ? 'No matches found.' : 'No places saved yet.'}
            </Text>
            <Text style={styles.emptyHint}>Tap + to add a place.</Text>
          </View>
        }
      />
      {renderAddFab()}
      <ConfirmationModal
        visible={deleteModalVisible}
        title="Delete Place"
        message={`Are you sure you want to delete "${placeToDelete?.name}"? This action cannot be undone.`}
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
  screen: {
    flex: 1,
    backgroundColor: '#f1f5f9',
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  listContentPadded: {
    padding: 20,
    paddingBottom: 88,
    flexGrow: 1,
  },
  placeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  cardHeader: {
    backgroundColor: '#2563eb',
    padding: 20,
    paddingBottom: 16,
  },
  cardHeaderTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  cardHeaderAddress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderAddressText: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.95,
  },
  cardContent: {
    padding: 20,
  },
  infoSection: {
    marginBottom: 16,
  },
  infoSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1d4ed8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  notesBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  notesText: {
    fontSize: 15,
    color: '#1e3a8a',
    lineHeight: 22,
  },
  coordinatesLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1d4ed8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  coordinatesBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  coordinatesText: {
    fontSize: 15,
    color: '#1e3a8a',
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  navigateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#3b82f6',
    marginRight: 12,
  },
  navigateButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2563eb',
  },
  removeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fce7f3',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  removeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ef4444',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyHint: {
    marginTop: 12,
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
