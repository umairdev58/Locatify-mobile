import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View, Text, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as Location from 'expo-location';

import AccountGuard from '@/components/AccountGuard';
import MapLocationPicker from '@/components/MapLocationPicker';
import { useToast } from '@/components/ToastProvider';
import { savePlace, updatePlace } from '@/api/place';

type Coords = { latitude: number; longitude: number };

export default function AddPlaceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    lat?: string;
    lng?: string;
    name?: string;
    notes?: string;
    placeId?: string;
  }>();
  const { showToast } = useToast();
  const [name, setName] = useState(params.name ?? '');
  const [notes, setNotes] = useState(params.notes ?? '');
  const [selectedCoords, setSelectedCoords] = useState<Coords | null>(null);
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
      const coords: Coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setSelectedCoords(coords);
    } catch {
      Alert.alert('Error', 'Unable to get your current location.');
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setSaveError('Enter a name for this place.');
      showToast('Enter a name for this place.', 'error');
      return;
    }

    if (!selectedCoords) {
      setSaveError('Drop a pin on the map or use your current location.');
      showToast('Pick a location on the map first.', 'error');
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
        setTimeout(() => router.back(), 500);
      } else {
        await savePlace({
          name: name.trim(),
          notes: notes.trim(),
          location: selectedCoords,
        });
        showToast('Place saved successfully!', 'success');
        setTimeout(() => router.back(), 500);
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
        <View style={[styles.header, { paddingTop: 16 + insets.top + 8 }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <FontAwesome name="chevron-left" size={20} color="#111827" />
          </Pressable>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>{isEditing ? 'Edit place' : 'Pin a place'}</Text>
            <Text style={styles.headerSubtitle}>
              {isEditing ? 'Update name, notes, or location' : 'Name it, then set the map pin'}
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: 100 + insets.bottom + 6 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.hint}>
            <View style={styles.hintIcon}>
              <FontAwesome name="info-circle" size={15} color="#2563eb" />
            </View>
            <Text style={styles.hintText}>
              Saved places appear under Pin Loc. Drop an accurate pin so you can open it in maps anytime.
            </Text>
          </View>

          <View style={styles.primaryBlock}>
            <View style={styles.labelRow}>
              <FontAwesome name="map-pin" size={14} color="#2563eb" />
              <Text style={styles.labelStrong}>Place name</Text>
            </View>
            <Text style={styles.fieldHint}>Required — how you’ll recognize this pin</Text>
            <TextInput
              value={name}
              onChangeText={(t) => {
                setName(t);
                if (saveError) setSaveError(null);
              }}
              placeholder="e.g. Parking spot, Trail head, Café meetup"
              placeholderTextColor="#94a3b8"
              style={styles.inputPrimary}
            />
          </View>

          <Text style={styles.groupHeading}>Notes</Text>
          <View style={styles.group}>
            <View style={styles.labelRow}>
              <FontAwesome name="align-left" size={14} color="#64748b" />
              <Text style={styles.label}>Extra detail</Text>
              <Text style={styles.optionalPill}>Optional</Text>
            </View>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Hours, access tips, who to meet…"
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={[styles.inputPrimary, styles.inputMultiline]}
            />
          </View>

          <View style={styles.mapHintBox}>
            <View style={styles.mapHintIcon}>
              <FontAwesome name="crosshairs" size={14} color="#fff" />
            </View>
            <Text style={styles.mapHintText}>Drag the map or tap to place your pin. You can refine with current GPS below.</Text>
          </View>

          <View style={styles.mapContainer}>
            <MapLocationPicker
              onLocationSelect={(coords: Coords) => setSelectedCoords(coords)}
              initialLocation={selectedCoords ?? undefined}
            />
          </View>

          <View style={styles.coordinatesRow}>
            <View style={[styles.coordCell, { marginRight: 10 }]}>
              <Text style={styles.coordLabel}>Latitude</Text>
              <TextInput
                value={selectedCoords ? selectedCoords.latitude.toFixed(4) : '—'}
                editable={false}
                style={styles.coordInput}
              />
            </View>
            <View style={styles.coordCell}>
              <Text style={styles.coordLabel}>Longitude</Text>
              <TextInput
                value={selectedCoords ? selectedCoords.longitude.toFixed(4) : '—'}
                editable={false}
                style={styles.coordInput}
              />
            </View>
          </View>

          <Pressable style={styles.locationButton} onPress={handleUseCurrentLocation}>
            <FontAwesome name="location-arrow" size={16} color="#2563eb" style={{ marginRight: 10 }} />
            <Text style={styles.locationButtonText}>Use my current location</Text>
          </Pressable>

          {saveError ? (
            <View style={styles.inlineError}>
              <Text style={styles.inlineErrorText}>{saveError}</Text>
            </View>
          ) : null}
        </ScrollView>

        <View style={[styles.bottomBar, { paddingBottom: 6 + insets.bottom + 4 }]}>
          <View style={styles.footer}>
            <Pressable style={styles.cancelButton} onPress={() => router.back()}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonLabel}>{isEditing ? 'Update' : 'Save place'}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </AccountGuard>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
    marginTop: 4,
  },
  content: {
    padding: 20,
    paddingTop: 12,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#eff6ff',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.22)',
    marginBottom: 18,
  },
  hintIcon: {
    marginRight: 10,
    marginTop: 1,
  },
  hintText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#1e40af',
    lineHeight: 19,
  },
  primaryBlock: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.28)',
    shadowColor: '#2563eb',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
  },
  groupHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563eb',
    letterSpacing: 0.85,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  group: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  labelStrong: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  label: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  optionalPill: {
    marginLeft: 'auto',
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  fieldHint: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 10,
    marginTop: -2,
  },
  inputPrimary: {
    minHeight: 50,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '500',
    color: '#0f172a',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.45)',
  },
  inputMultiline: {
    minHeight: 100,
    marginTop: 4,
    paddingTop: 14,
  },
  mapHintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.2)',
  },
  mapHintIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mapHintText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#1e40af',
    lineHeight: 19,
  },
  mapContainer: {
    height: 280,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#e2e8f0',
  },
  coordinatesRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  coordCell: {
    flex: 1,
  },
  coordLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  coordInput: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontVariant: ['tabular-nums'],
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.35)',
  },
  locationButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2563eb',
  },
  inlineError: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  inlineErrorText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  bottomBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 12,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748b',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.65,
  },
  saveButtonLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
