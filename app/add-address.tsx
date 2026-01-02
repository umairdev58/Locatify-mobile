import { Alert, Image, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import AccountGuard from '@/components/AccountGuard';
import MapLocationPicker from '@/components/MapLocationPicker';
import ImageUploader from '@/components/ImageUploader';
import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { saveAddress, updateAddress } from '@/api/address';
import type { ImageAsset } from '@/types/image';

const steps = [
  { id: 1, title: 'Text Address', subtitle: 'House, landmark, and notes' },
  { id: 2, title: 'Map', subtitle: 'Pin drop and confirm' },
  { id: 3, title: 'Photos', subtitle: 'Add reference snaps' },
  { id: 4, title: 'Review', subtitle: 'Preview or save the card' },
];

export default function AddAddressScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    lat?: string;
    lng?: string;
    cardName?: string;
    address?: string;
    addressId?: string;
  }>();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const [currentStep, setCurrentStep] = useState(1);
  const [cardName, setCardName] = useState(params.cardName ?? '');
  const [house, setHouse] = useState('');
  const [landmark, setLandmark] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedCoords, setSelectedCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [houseImages, setHouseImages] = useState<ImageAsset[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const inputBackground = isDark ? '#1c1f33' : '#f3f5ff';

  const goNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  useEffect(() => {
    if (params.lat && params.lng) {
      const lat = Number(params.lat);
      const lng = Number(params.lng);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        setSelectedCoords({ latitude: lat, longitude: lng });
      }
    }
    if (params.cardName) {
      setCardName(params.cardName);
    }
    if (params.address) {
      setHouse(params.address);
    }
  }, [params.lat, params.lng, params.cardName, params.address]);

  const isEditing = Boolean(params.addressId);

  const handleSetLocation = () => {
    router.push({
      pathname: '/select-location',
      params: { redirect: '/add-address' },
    });
  };

  const handlePreview = () => {
    alert('Previewing address card');
  };

  const handleSave = async () => {
    if (!selectedCoords || !house) {
      setSaveError('Provide address text and location before saving.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      if (isEditing && params.addressId) {
        await updateAddress(params.addressId, {
          fullTextAddress: house,
          location: selectedCoords,
          cardName,
          houseImages,
        });
      } else {
        await saveAddress({
          fullTextAddress: house,
          location: selectedCoords,
          cardName,
          houseImages,
        });
      }
      alert(isEditing ? 'Address updated!' : 'Address saved!');
      router.replace({ pathname: '/(tabs)' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save address';
      setSaveError(message);
      Alert.alert('Save failed', message);
    } finally {
      setSaving(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <Text style={[styles.sectionLabel, { color: theme.tabIconDefault }]}>Card name</Text>
            <TextInput
              value={cardName}
              onChangeText={setCardName}
              placeholder="Home, Work, etc."
              placeholderTextColor="#8687a4"
              style={[styles.input, { backgroundColor: inputBackground, color: theme.text }]}
            />
            <Text style={[styles.sectionLabel, { color: theme.tabIconDefault }]}>House / Street / Block (optional)</Text>
            <TextInput
              value={house}
              onChangeText={setHouse}
              placeholder="123 Main St, Block B"
              placeholderTextColor="#8687a4"
              style={[styles.input, { backgroundColor: inputBackground, color: theme.text }]}
            />
            <Text style={[styles.sectionLabel, { color: theme.tabIconDefault }]}>Landmarks (optional)</Text>
            <TextInput
              value={landmark}
              onChangeText={setLandmark}
              placeholder="Near the community center"
              placeholderTextColor="#8687a4"
              style={[styles.input, { backgroundColor: inputBackground, color: theme.text }]}
            />
            <Text style={[styles.sectionLabel, { color: theme.tabIconDefault }]}>Notes (optional)</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Label this card for drivers"
              placeholderTextColor="#8687a4"
              multiline
              numberOfLines={3}
              style={[styles.input, styles.notesInput, { backgroundColor: inputBackground, color: theme.text }]}
            />
          </>
        );
      case 2:
        return (
          <View style={styles.mapSection}>
            <MapLocationPicker
              onLocationSelect={(coords) => setSelectedCoords(coords)}
              initialLocation={selectedCoords ?? undefined}
            />
            <Text style={[styles.mapHint, { color: theme.tabIconDefault, marginTop: 8 }]}>
              {selectedCoords
                ? `Selected: ${selectedCoords.latitude.toFixed(5)}, ${selectedCoords.longitude.toFixed(5)}`
                : 'Tap anywhere to drop a pin.'}
            </Text>
          </View>
        );
      case 3:
        return (
          <View>
            <Text style={[styles.sectionLabel, { color: theme.tabIconDefault }]}>House photos</Text>
            <ImageUploader images={houseImages} onImagesChange={setHouseImages} maxImages={4} />
            <Text style={[styles.mapHint, { color: theme.tabIconDefault, marginTop: 8 }]}>
              {houseImages.length
                ? `${houseImages.length} photo${houseImages.length === 1 ? '' : 's'} staged`
                : 'Add up to 4 reference snaps.'}
            </Text>
          </View>
        );
      case 4:
        return (
          <View style={[styles.reviewContainer, { backgroundColor: isDark ? '#141427' : '#f9f9ff' }]}> 
            <View style={styles.reviewRow}>
              <Text style={[styles.reviewLabel, { color: theme.tabIconDefault }]}>Card name</Text>
              <Text style={[styles.reviewValue, { color: theme.text }]}>
                {cardName || 'Untitled'}
              </Text>
            </View>
            <View style={styles.reviewRow}>
              <Text style={[styles.reviewLabel, { color: theme.tabIconDefault }]}>Address</Text>
              <Text style={[styles.reviewValue, { color: theme.text }]}>{house || 'Not provided yet'}</Text>
            </View>
            <View style={styles.reviewRow}>
              <Text style={[styles.reviewLabel, { color: theme.tabIconDefault }]}>Landmark</Text>
              <Text style={[styles.reviewValue, { color: theme.text }]}>{landmark || 'Fresh location'}</Text>
            </View>
            <View style={styles.reviewRow}>
              <Text style={[styles.reviewLabel, { color: theme.tabIconDefault }]}>Notes</Text>
              <Text style={[styles.reviewValue, { color: theme.text }]}>{notes || 'No notes yet'}</Text>
            </View>
            <View style={[styles.reviewRow, { marginTop: 8 }]}>
              <Text style={[styles.reviewLabel, { color: theme.tabIconDefault }]}>Location</Text>
              <Text style={[styles.reviewValue, { color: theme.text }]}>
                {selectedCoords
                  ? `${selectedCoords.latitude.toFixed(5)}, ${selectedCoords.longitude.toFixed(5)}`
                  : 'Location not set'}
              </Text>
            </View>
            <View style={[styles.reviewChip, { borderColor: theme.tint }]}>
              <Text style={[styles.reviewChipText, { color: theme.tint }]}>
                {selectedCoords ? 'Location pinned' : 'Location not set'}
              </Text>
            </View>
            {houseImages.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { color: theme.tabIconDefault, marginTop: 12 }]}>
                  Photos
                </Text>
                <View style={styles.reviewImagesRow}>
                  {houseImages.map((image, index) => (
                    <Image key={`${image.uri}-${index}`} source={{ uri: image.uri }} style={styles.reviewImage} />
                  ))}
                </View>
              </>
            )}
          </View>
        );
      default:
        return null;
    }
  };

  const iconBg = isDark ? '#1b1c33' : '#f4f5ff';

  return (
    <AccountGuard required="user">
      <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.stepIndicator}>
          {steps.map((step) => {
            const isActive = step.id === currentStep;
            return (
              <View key={step.id} style={styles.stepItem}>
                <View
                  style={[
                    styles.stepCircle,
                    {
                      borderColor: isActive ? theme.tint : '#cfd2e5',
                      backgroundColor: isActive ? theme.tint : iconBg,
                    },
                  ]}>
                  <Text style={{ color: isActive ? '#fff' : theme.tabIconDefault }}>{step.id}</Text>
                </View>
                <View style={styles.stepText}>
                  <Text style={[styles.stepTitle, { color: theme.text }]}>{step.title}</Text>
                  <Text style={[styles.stepSubtitle, { color: theme.tabIconDefault }]}>{step.subtitle}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={[styles.sectionWrapper, isDark && styles.sectionWrapperDark]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Step {currentStep}: {steps[currentStep - 1].title}
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.tabIconDefault }]}>
            {steps[currentStep - 1].subtitle}
          </Text>
          {renderStepContent()}
        </View>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: isDark ? '#1d1d2a' : '#ebecf6' }]}>
        <Pressable style={styles.navButton} onPress={goBack} disabled={currentStep === 1}>
          <Text
            style={[
              styles.navButtonText,
              currentStep === 1 && styles.navDisabled,
              { color: theme.tabIconDefault },
            ]}>
            Back
          </Text>
        </Pressable>

        {currentStep < steps.length ? (
          <Pressable style={styles.navButtonPrimary} onPress={goNext}>
            <Text style={styles.navPrimaryText}>Next</Text>
          </Pressable>
        ) : (
          <View style={styles.finalCtas}> 
            <Pressable style={[styles.previewButton, { borderColor: theme.tint }]} onPress={handlePreview}>
              <Text style={[styles.previewText, { color: theme.tint }]}>Preview</Text>
            </Pressable>
            <Pressable
              style={[styles.saveButton, saving && styles.saveDisabled]}
              onPress={handleSave}
              disabled={saving}>
              <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save address card'}</Text>
            </Pressable>
          </View>
        )}
        {saveError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{saveError}</Text>
          </View>
        ) : null}
      </View>
    </View>
    </AccountGuard>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 120,
  },
  stepIndicator: {
    marginBottom: 24,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#cfd2e5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepText: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  stepSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionWrapper: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 6,
  },
  sectionWrapperDark: {
    backgroundColor: '#0c0c17',
    shadowOpacity: 0.25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 18,
  },
  sectionLabel: {
    fontSize: 13,
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    marginBottom: 18,
  },
  notesInput: {
    height: 90,
    paddingTop: 12,
  },
  mapContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2f2f4a',
    backgroundColor: '#0d0d1c',
  },
  mapPlaceholder: {
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#151525',
  },
  mapHint: {
    marginTop: 12,
    color: '#97a0c4',
    fontSize: 14,
  },
  setLocationButton: {
    backgroundColor: '#5d5cff',
    padding: 16,
    alignItems: 'center',
  },
  setLocationText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  photoCard: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#8f90c8',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
  },
  photoPreview: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: '#1f1f2c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewContainer: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#cfd2ea',
    marginTop: 12,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  reviewLabel: {
    fontSize: 14,
  },
  reviewValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  reviewChip: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
  },
  reviewChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reviewImagesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  reviewImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    backgroundColor: 'transparent',
  },
  navButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  navButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6f6f87',
  },
  navDisabled: {
    opacity: 0.3,
  },
  navButtonPrimary: {
    backgroundColor: '#5d5cff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  navPrimaryText: {
    color: '#fff',
    fontWeight: '600',
  },
  finalCtas: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewButton: {
    marginRight: 12,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1,
  },
  previewText: {
    fontWeight: '600',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#5d5cff',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 16,
  },
  saveText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  saveDisabled: {
    opacity: 0.6,
  },
  errorText: {
    marginTop: 8,
    fontSize: 13,
    color: '#ff4d4d',
    textAlign: 'center',
  },
  mapSection: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#d1d4f0',
  },
  errorBanner: {
    marginTop: 12,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(220, 38, 38, 0.12)',
    borderWidth: 1,
    borderColor: '#dc2626',
  },
});
