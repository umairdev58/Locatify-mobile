import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View, Text, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as Location from 'expo-location';

import AccountGuard from '@/components/AccountGuard';
import MapLocationPicker from '@/components/MapLocationPicker';
import { useColorScheme } from '@/components/useColorScheme';
import { useToast } from '@/components/ToastProvider';
import Colors from '@/constants/Colors';
import { savePlace, updatePlace } from '@/api/place';

export default function AddPlaceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    lat?: string;
    lng?: string;
    name?: string;
    notes?: string;
    placeId?: string;
  }>();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { showToast } = useToast();
  const [name, setName] = useState(params.name ?? '');
  const [notes, setNotes] = useState(params.notes ?? '');
  const [selectedCoords, setSelectedCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (params.lat && params.lng) {
      const lat = Number(params.lat);
      const lng = Number(params.lng);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        setSelectedCoords({ latitude: lat, longitude: lng });
      }
    }
    if (params.name) {
      setName(params.name);
    }
    if (params.notes) {
      setNotes(params.notes);
    }
  }, [params.lat, params.lng, params.name, params.notes]);

  const isEditing = Boolean(params.placeId);

  const handleUseCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to use your current location.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setSelectedCoords(coords);
    } catch (error) {
      Alert.alert('Error', 'Unable to get your current location.');
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setSaveError('Please enter a name for this place.');
      return;
    }

    if (!selectedCoords) {
      setSaveError('Please select a location on the map.');
      return;
    }

    setSaveError(null);
    setSaving(true);

    try {
      if (isEditing && params.placeId) {
        await updatePlace({
          placeId: params.placeId,
          name: name.trim(),
          notes: notes.trim(),
          location: selectedCoords,
        });
        showToast('Place updated successfully!', 'success');
        // Small delay to show toast before navigation
        setTimeout(() => {
          router.back();
        }, 500);
      } else {
        await savePlace({
          name: name.trim(),
          notes: notes.trim(),
          location: selectedCoords,
        });
        showToast('Place saved successfully!', 'success');
        // Small delay to show toast before navigation
        setTimeout(() => {
          router.back();
        }, 500);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save place';
      setSaveError(message);
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AccountGuard required="user">
      <View style={styles.screen}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <FontAwesome name="chevron-left" size={20} color="#111827" />
          </Pressable>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>{isEditing ? 'Edit Place' : 'Add New Place'}</Text>
            <Text style={styles.headerSubtitle}>Save a location you want to remember</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Name Field */}
          <Text style={styles.fieldLabel}>Place Name *</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g., Parking Spot, Friend's House, Workshop"
            placeholderTextColor="#9ca3af"
            style={styles.input}
          />

          {/* Notes Field */}
          <Text style={styles.fieldLabel}>Notes (optional)</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Add any helpful notes about this place"
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={3}
            style={[styles.input, styles.notesInput]}
          />

          {/* Instruction Box */}
          <View style={styles.instructionBox}>
            <View style={styles.instructionIcon}>
              <FontAwesome name="exclamation" size={16} color="#fff" />
            </View>
            <Text style={styles.instructionText}>
              Drop a precise pin on the map or get your location automatically
            </Text>
          </View>

          {/* Map */}
          <View style={styles.mapContainer}>
            <MapLocationPicker
              onLocationSelect={(coords) => setSelectedCoords(coords)}
              initialLocation={selectedCoords ?? undefined}
            />
          </View>

          {/* Coordinates Input */}
          <View style={styles.coordinatesRow}>
            <View style={[styles.coordinateField, { marginRight: 12 }]}>
              <Text style={styles.coordinateLabel}>Latitude</Text>
              <TextInput
                value={selectedCoords ? selectedCoords.latitude.toFixed(4) : '0.0000'}
                editable={false}
                style={styles.coordinateInput}
                placeholderTextColor="#9ca3af"
              />
            </View>
            <View style={styles.coordinateField}>
              <Text style={styles.coordinateLabel}>Longitude</Text>
              <TextInput
                value={selectedCoords ? selectedCoords.longitude.toFixed(4) : '0.0000'}
                editable={false}
                style={styles.coordinateInput}
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          {/* Use Current Location Button */}
          <Pressable style={styles.currentLocationButton} onPress={handleUseCurrentLocation}>
            <FontAwesome name="location-arrow" size={16} color="#3b82f6" style={{ marginRight: 8 }} />
            <Text style={styles.currentLocationButtonText}>Use My Current Location</Text>
          </Pressable>

          {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Pressable style={styles.backButtonAction} onPress={() => router.back()}>
              <Text style={styles.backButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>{isEditing ? 'Update Place' : 'Save Place'}</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 20,
  },
  notesInput: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  instructionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  instructionIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 13,
    color: '#92400e',
    lineHeight: 18,
  },
  mapContainer: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  coordinatesRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  coordinateField: {
    flex: 1,
  },
  coordinateLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  coordinateInput: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontFamily: 'monospace',
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 24,
  },
  currentLocationButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3b82f6',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
    marginBottom: 16,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 8,
  },
  backButtonAction: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});

