import { Alert, Image, Pressable, ScrollView, StyleSheet, TextInput, View, Text } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

import AccountGuard from '@/components/AccountGuard';
import MapLocationPicker from '@/components/MapLocationPicker';
import ImageUploader from '@/components/ImageUploader';
import { useColorScheme } from '@/components/useColorScheme';
import { useToast } from '@/components/ToastProvider';
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
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    lat?: string;
    lng?: string;
    cardName?: string;
    address?: string;
    landmark?: string;
    notes?: string;
    addressId?: string;
    /** JSON array of image URL strings when opening edit flow */
    houseImages?: string;
  }>();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [cardName, setCardName] = useState(params.cardName ?? '');
  const [house, setHouse] = useState('');
  const [landmark, setLandmark] = useState(params.landmark ?? '');
  const [notes, setNotes] = useState(params.notes ?? '');
  const [selectedCoords, setSelectedCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [houseImages, setHouseImages] = useState<ImageAsset[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [cardNameError, setCardNameError] = useState<string | null>(null);
  /** Avoid re-applying route images when other params change (would wipe newly picked photos). */
  const appliedHouseImagesParam = useRef<string | undefined>(undefined);
  const inputBackground = isDark ? '#1c1f33' : '#f3f5ff';

  const goNext = () => {
    if (currentStep === 1 && !cardName.trim()) {
      setCardNameError('Enter a card name to continue.');
      showToast('Enter a card name to continue.', 'error');
      return;
    }
    setCardNameError(null);
    if (currentStep < steps.length) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const goToStep = (stepId: number) => {
    if (stepId === currentStep || stepId < 1 || stepId > steps.length) {
      return;
    }
    if (stepId > currentStep && currentStep === 1 && !cardName.trim()) {
      setCardNameError('Enter a card name to continue.');
      showToast('Enter a card name to continue.', 'error');
      return;
    }
    setCardNameError(null);
    setCurrentStep(stepId);
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
    if (params.landmark !== undefined) {
      setLandmark(params.landmark);
    }
    if (params.notes !== undefined) {
      setNotes(params.notes);
    }
    if (
      typeof params.houseImages === 'string' &&
      params.houseImages !== appliedHouseImagesParam.current
    ) {
      appliedHouseImagesParam.current = params.houseImages;
      try {
        const parsed = JSON.parse(params.houseImages);
        const urls = Array.isArray(parsed)
          ? parsed.filter((u): u is string => typeof u === 'string' && u.length > 0)
          : [];
        setHouseImages(
          urls.map((uri, i) => ({
            uri,
            name: `photo-${i}.jpg`,
            type: 'image/jpeg',
          })),
        );
      } catch {
        // ignore invalid param
      }
    }
  }, [
    params.lat,
    params.lng,
    params.cardName,
    params.address,
    params.landmark,
    params.notes,
    params.houseImages,
  ]);

  const isEditing = Boolean(params.addressId);

  const handleSetLocation = () => {
    router.push({
      pathname: '/select-location',
      params: { redirect: '/add-address' },
    });
  };

  const handleUseCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to use your current location.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setSelectedCoords(coords);
    } catch (error) {
      Alert.alert('Error', 'Unable to get your current location. Please try again.');
    }
  };

  const handleChoosePhotos = async () => {
    if (houseImages.length >= 5) {
      Alert.alert('Maximum Reached', 'You can upload a maximum of 5 photos.');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Allow access to your photo library to upload photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.6,
      allowsMultipleSelection: true,
    });

    if (result.canceled || !result.assets.length) {
      return;
    }

    const remainingSlots = 5 - houseImages.length;
    const assetsToAdd = result.assets.slice(0, remainingSlots);

    const newImages: ImageAsset[] = [];
    for (const asset of assetsToAdd) {
      try {
        const base64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: 'base64',
        });
        newImages.push({
          uri: asset.uri,
          name: asset.fileName ?? `photo-${Date.now()}.jpg`,
          type: asset.type ?? 'image/jpeg',
          base64,
        });
      } catch (error) {
        console.error('Error processing image:', error);
      }
    }

    setHouseImages([...houseImages, ...newImages]);
  };

  const handlePreview = () => {
    alert('Previewing address card');
  };

  const handleSave = async () => {
    const houseTrim = house.trim();
    const landmarkTrim = landmark.trim();
    const notesTrim = notes.trim();
    if (!cardName.trim()) {
      setSaveError('Add a card name before saving.');
      showToast('Add a card name before saving.', 'error');
      return;
    }
    if (!selectedCoords) {
      setSaveError('Pick a location on the map before saving.');
      return;
    }
    if (!houseTrim && !landmarkTrim && !notesTrim) {
      setSaveError('Add a street address, landmark, or notes before saving.');
      return;
    }
    const fullTextAddress = houseTrim || landmarkTrim || notesTrim;
    setSaving(true);
    setSaveError(null);
    try {
      let savedAddress;
      if (isEditing && params.addressId) {
        savedAddress = await updateAddress(params.addressId, {
          fullTextAddress,
          location: selectedCoords,
          cardName,
          landmark: landmarkTrim,
          notes: notesTrim,
          houseImages,
        });
      } else {
        savedAddress = await saveAddress({
          fullTextAddress,
          location: selectedCoords,
          cardName,
          landmark: landmarkTrim,
          notes: notesTrim,
          houseImages,
        });
      }
      showToast(isEditing ? 'Address updated successfully!' : 'Address saved successfully!', 'success');
      // Small delay to show toast before navigation
      setTimeout(() => {
        router.replace({ pathname: '/(tabs)' });
      }, 500);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save address';
      setSaveError(message);
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.step1Root}>
            <View style={styles.step1Hint}>
              <View style={styles.step1HintIcon}>
                <FontAwesome name="info-circle" size={15} color="#2563eb" />
              </View>
              <Text style={styles.step1HintText}>
                Name your card, then add any street details, landmarks, or notes that help someone find this place.
              </Text>
            </View>

            <View style={styles.step1PrimaryBlock}>
              <View style={styles.step1LabelRow}>
                <FontAwesome name="bookmark" size={14} color="#2563eb" />
                <Text style={styles.step1LabelStrong}>Card name</Text>
              </View>
              <Text style={styles.step1FieldHint}>How this location appears in your list</Text>
              <TextInput
                value={cardName}
                onChangeText={(t) => {
                  setCardName(t);
                  if (cardNameError) setCardNameError(null);
                }}
                placeholder="e.g. Home, Office, Dad’s place"
                placeholderTextColor="#94a3b8"
                style={[styles.step1Input, cardNameError ? styles.step1InputError : null]}
              />
              {cardNameError ? <Text style={styles.step1ErrorText}>{cardNameError}</Text> : null}
            </View>

            <Text style={styles.step1GroupHeading}>Address & extra detail</Text>

            <View style={styles.step1Group}>
              <View style={styles.step1LabelRow}>
                <FontAwesome name="road" size={14} color="#64748b" />
                <Text style={styles.step1Label}>Street / block</Text>
                <Text style={styles.step1OptionalPill}>Optional</Text>
              </View>
              <TextInput
                value={house}
                onChangeText={setHouse}
                placeholder="House number, street, phase…"
                placeholderTextColor="#94a3b8"
                style={styles.step1Input}
              />

              <View style={[styles.step1LabelRow, styles.step1LabelRowAfterField]}>
                <FontAwesome name="map-signs" size={14} color="#64748b" />
                <Text style={styles.step1Label}>Landmark</Text>
                <Text style={styles.step1OptionalPill}>Optional</Text>
              </View>
              <TextInput
                value={landmark}
                onChangeText={setLandmark}
                placeholder="Near a school, building name…"
                placeholderTextColor="#94a3b8"
                style={styles.step1Input}
              />

              <View style={[styles.step1LabelRow, styles.step1LabelRowAfterField]}>
                <FontAwesome name="align-left" size={14} color="#64748b" />
                <Text style={styles.step1Label}>Notes</Text>
                <Text style={styles.step1OptionalPill}>Optional</Text>
              </View>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Anything else for you or a driver (floor, gate code, tips)…"
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={[styles.step1Input, styles.step1InputMultiline]}
              />
            </View>
          </View>
        );
      case 2:
        return (
          <>
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
              <Text style={styles.currentLocationButtonText}>Use My Current Location</Text>
            </Pressable>
          </>
        );
      case 3:
        return (
          <>
            {/* Upload Area */}
            <Pressable style={styles.uploadArea} onPress={handleChoosePhotos}>
              <FontAwesome name="cloud-upload" size={40} color="#9ca3af" />
              <Text style={styles.uploadAreaText}>Drop photos here or click to upload</Text>
              <Text style={styles.uploadAreaSubtext}>Maximum 5 photos, up to 5MB each</Text>
              <Pressable style={styles.choosePhotosButton} onPress={handleChoosePhotos}>
                <Text style={styles.choosePhotosButtonText}>Choose Photos</Text>
              </Pressable>
            </Pressable>

            {/* Photos Preview */}
            {houseImages.length > 0 ? (
              <View style={styles.photosPreview}>
                {houseImages.map((image, index) => (
                  <View key={`${image.uri}-${index}`} style={[styles.photoThumbnail, { marginRight: 12, marginBottom: 12 }]}>
                    <Image source={{ uri: image.uri }} style={styles.photoThumbnailImage} />
                    <Pressable
                      style={styles.removePhotoButton}
                      onPress={() => {
                        const newImages = houseImages.filter((_, idx) => idx !== index);
                        setHouseImages(newImages);
                      }}>
                      <FontAwesome name="times" size={12} color="#fff" />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noPhotosContainer}>
                <FontAwesome name="image" size={48} color="#d1d5db" />
                <Text style={styles.noPhotosText}>No photos yet. Add reference photos of the location.</Text>
              </View>
            )}
          </>
        );
      case 4:
        return (
          <>
            {/* Address Details Card */}
            <View style={styles.addressDetailsCard}>
              <Text style={styles.addressDetailsTitle}>{cardName || 'Untitled'}</Text>
              
              <View style={styles.addressDetailsRow}>
                <FontAwesome name="map-marker" size={16} color="#f97316" style={styles.addressDetailsIcon} />
                <View style={styles.addressDetailsContent}>
                  <Text style={styles.addressDetailsLabel}>ADDRESS</Text>
                  <Text style={styles.addressDetailsValue}>{house || 'Not provided yet'}</Text>
                </View>
              </View>

              {landmark.trim() ? (
                <View style={styles.addressDetailsRow}>
                  <FontAwesome name="map-signs" size={16} color="#2563eb" style={styles.addressDetailsIcon} />
                  <View style={styles.addressDetailsContent}>
                    <Text style={styles.addressDetailsLabel}>LANDMARK</Text>
                    <Text style={styles.addressDetailsValue}>{landmark.trim()}</Text>
                  </View>
                </View>
              ) : null}

              {notes.trim() ? (
                <View style={styles.addressDetailsRow}>
                  <FontAwesome name="align-left" size={16} color="#64748b" style={styles.addressDetailsIcon} />
                  <View style={styles.addressDetailsContent}>
                    <Text style={styles.addressDetailsLabel}>NOTES</Text>
                    <Text style={styles.addressDetailsValue}>{notes.trim()}</Text>
                  </View>
                </View>
              ) : null}

              <View style={styles.addressDetailsRow}>
                <FontAwesome name="map-marker" size={16} color="#3b82f6" style={styles.addressDetailsIcon} />
                <View style={styles.addressDetailsContent}>
                  <Text style={styles.addressDetailsLabel}>COORDINATES</Text>
                  <Text style={styles.addressDetailsValue}>
                    {selectedCoords
                      ? `${selectedCoords.latitude.toFixed(4)}, ${selectedCoords.longitude.toFixed(4)}`
                      : 'Not set'}
                  </Text>
                </View>
              </View>

              {houseImages.length > 0 ? (
                <View style={styles.addressDetailsRow}>
                  <FontAwesome name="camera" size={16} color="#64748b" style={styles.addressDetailsIcon} />
                  <View style={styles.addressDetailsContent}>
                    <Text style={styles.addressDetailsLabel}>
                      REFERENCE PHOTOS ({houseImages.length})
                    </Text>
                    <ScrollView
                      horizontal
                      nestedScrollEnabled
                      showsHorizontalScrollIndicator={false}
                      style={styles.reviewPhotosScroll}
                      contentContainerStyle={styles.reviewPhotosScrollContent}>
                      {houseImages.map((image, index) => (
                        <Image
                          key={`${image.uri}-${index}`}
                          source={{ uri: image.uri }}
                          style={[styles.reviewImage, index === houseImages.length - 1 && styles.reviewImageLast]}
                        />
                      ))}
                    </ScrollView>
                  </View>
                </View>
              ) : null}
            </View>

            {/* Card Name Input */}
            <View style={styles.cardNameSection}>
              <Text style={styles.cardNameLabel}>Card Name</Text>
              <TextInput
                value={cardName}
                onChangeText={setCardName}
                placeholder="Enter card name"
                placeholderTextColor="#9ca3af"
                style={styles.cardNameInput}
              />
            </View>
          </>
        );
      default:
        return null;
    }
  };

  const iconBg = isDark ? '#1b1c33' : '#f4f5ff';

  return (
    <AccountGuard required="user">
      <View style={styles.screen}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: 16 + insets.top + 8 }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <FontAwesome name="chevron-left" size={20} color="#111827" />
          </Pressable>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Create Address Card</Text>
            <Text style={styles.headerSubtitle}>Step {currentStep} of {steps.length}</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: 120 + insets.bottom + 6 }]}
          showsVerticalScrollIndicator={false}>
          {/* Stepper */}
          <View style={styles.progressWrap}>
            <View style={styles.progressContainer}>
              {steps.map((step, index) => {
                const isActive = step.id === currentStep;
                const isCompleted = step.id < currentStep;
                return (
                  <View key={step.id} style={styles.progressItem}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${step.title}, step ${step.id}`}
                      hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}
                      onPress={() => goToStep(step.id)}
                      style={({ pressed }) => [
                        styles.progressCircle,
                        isCompleted && styles.progressCircleCompleted,
                        isActive && !isCompleted && styles.progressCircleActive,
                        pressed && styles.progressCirclePressed,
                      ]}>
                      {isCompleted ? (
                        <FontAwesome name="check" size={14} color="#fff" />
                      ) : (
                        <Text
                          style={[
                            styles.progressCircleText,
                            isActive && styles.progressCircleTextActive,
                          ]}>
                          {step.id}
                        </Text>
                      )}
                    </Pressable>
                    {index < steps.length - 1 && (
                      <View
                        style={[
                          styles.progressLine,
                          isCompleted && styles.progressLineCompleted,
                          isActive && !isCompleted && styles.progressLineUpcoming,
                        ]}
                      />
                    )}
                  </View>
                );
              })}
            </View>
            <Text style={styles.progressCurrentTitle}>{steps[currentStep - 1]?.title}</Text>
            <Text style={styles.progressCurrentSubtitle}>{steps[currentStep - 1]?.subtitle}</Text>
          </View>

          {/* Main Card */}
          <View style={styles.card}>
            {renderStepContent()}
          </View>
        </ScrollView>

        <View style={[styles.bottomBar, { paddingBottom: 6 + insets.bottom + 4 }]}>
          <View style={styles.footer}>
            {currentStep > 1 ? (
              <Pressable style={styles.backButtonFooter} onPress={goBack}>
                <Text style={styles.backButtonText}>Back</Text>
              </Pressable>
            ) : (
              <View style={styles.footerLeadingSpacer} />
            )}

            {currentStep < steps.length ? (
              <Pressable style={styles.nextButtonFooter} onPress={goNext}>
                <Text style={styles.nextButtonTextFooter}>
                  {currentStep === 1
                    ? 'Next: Drop Pin'
                    : currentStep === 3
                      ? 'Next: Review & Save'
                      : 'Next'}
                </Text>
              </Pressable>
            ) : (
              <Pressable
                style={[styles.saveButtonText, saving && styles.saveDisabled]}
                onPress={handleSave}
                disabled={saving}>
                <Text style={styles.saveButtonTextLabel}>{saving ? 'Saving…' : 'Save Address Card'}</Text>
              </Pressable>
            )}
          </View>
          {saveError ? (
            <View style={styles.errorBannerFooter}>
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  bottomBar: {
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  content: {
    padding: 20,
    paddingTop: 8,
  },
  progressWrap: {
    backgroundColor: '#eff6ff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.2)',
    paddingTop: 18,
    paddingHorizontal: 14,
    paddingBottom: 16,
    marginBottom: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 14,
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  progressCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  progressCircleActive: {
    backgroundColor: '#2563eb',
    borderColor: '#1d4ed8',
    shadowColor: '#2563eb',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
  },
  progressCircleCompleted: {
    backgroundColor: '#2563eb',
    borderColor: '#1d4ed8',
    shadowOpacity: 0,
    elevation: 0,
  },
  progressCirclePressed: {
    opacity: 0.88,
    transform: [{ scale: 0.97 }],
  },
  progressCircleText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#94a3b8',
  },
  progressCircleTextActive: {
    color: '#fff',
  },
  progressLine: {
    flex: 1,
    height: 3,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 6,
    borderRadius: 2,
  },
  progressLineCompleted: {
    backgroundColor: '#2563eb',
  },
  progressLineUpcoming: {
    backgroundColor: '#bfdbfe',
  },
  progressCurrentTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  progressCurrentSubtitle: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  step1Root: {
    marginTop: -4,
  },
  step1Hint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#eff6ff',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.22)',
    marginBottom: 20,
  },
  step1HintIcon: {
    marginRight: 10,
    marginTop: 1,
  },
  step1HintText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#1e40af',
    lineHeight: 19,
  },
  step1PrimaryBlock: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.28)',
    shadowColor: '#2563eb',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
  },
  step1LabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  step1LabelRowAfterField: {
    marginTop: 4,
    marginBottom: 6,
  },
  step1LabelStrong: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  step1Label: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    letterSpacing: -0.1,
  },
  step1OptionalPill: {
    marginLeft: 'auto',
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  step1FieldHint: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 10,
    marginTop: -2,
  },
  step1GroupHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563eb',
    letterSpacing: 0.85,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  step1Group: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  step1Input: {
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
    marginBottom: 4,
  },
  step1InputMultiline: {
    minHeight: 108,
    marginBottom: 0,
    paddingTop: 14,
  },
  step1InputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  step1ErrorText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#dc2626',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
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
    marginBottom: 16,
  },
  notesInput: {
    height: 90,
    paddingTop: 12,
    textAlignVertical: 'top',
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
    width: 72,
    height: 72,
    borderRadius: 12,
    marginRight: 8,
    backgroundColor: '#e5e7eb',
  },
  reviewImageLast: {
    marginRight: 0,
  },
  reviewPhotosScroll: {
    marginTop: 4,
    maxHeight: 76,
  },
  reviewPhotosScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  footerLeadingSpacer: {
    flex: 1,
  },
  backButtonFooter: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
  },
  nextButtonFooter: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  nextButtonTextFooter: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
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
  instructionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  instructionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#1e40af',
    fontWeight: '500',
  },
  mapContainer: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
  },
  coordinatesRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  coordinateField: {
    flex: 1,
  },
  coordinateLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  coordinateInput: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  currentLocationButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  currentLocationButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  uploadArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    marginBottom: 20,
  },
  uploadAreaText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  uploadAreaSubtext: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 20,
  },
  choosePhotosButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  choosePhotosButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  photosPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  photoThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photoThumbnailImage: {
    width: '100%',
    height: '100%',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noPhotosContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noPhotosText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 12,
    textAlign: 'center',
  },
  addressDetailsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  addressDetailsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  addressDetailsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  addressDetailsIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  addressDetailsContent: {
    flex: 1,
  },
  addressDetailsLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  addressDetailsValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  cardNameSection: {
    marginBottom: 16,
  },
  cardNameLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  cardNameInput: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  saveButtonText: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonTextLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3b82f6',
  },
  errorBannerFooter: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
});
