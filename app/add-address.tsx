import { Alert, Image, Pressable, ScrollView, StyleSheet, TextInput, View, Text } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Clipboard from 'expo-clipboard';

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
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [cardName, setCardName] = useState(params.cardName ?? '');
  const [house, setHouse] = useState('');
  const [landmark, setLandmark] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedCoords, setSelectedCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [houseImages, setHouseImages] = useState<ImageAsset[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [publicCode, setPublicCode] = useState<string | null>(null);
  const [previewCode] = useState(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'ADDR-';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  });
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
    // If editing, we could fetch the publicCode here, but for now we'll show a preview
  }, [params.lat, params.lng, params.cardName, params.address]);

  const isEditing = Boolean(params.addressId);

  const handleSetLocation = () => {
    router.push({
      pathname: '/select-location',
      params: { redirect: '/add-address' },
    });
  };

  const handleCopyCode = async (code: string) => {
    await Clipboard.setStringAsync(code);
    Alert.alert('Copied!', 'Delivery code copied to clipboard');
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
    if (!selectedCoords || !house) {
      setSaveError('Provide address text and location before saving.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      let savedAddress;
      if (isEditing && params.addressId) {
        savedAddress = await updateAddress(params.addressId, {
          fullTextAddress: house,
          location: selectedCoords,
          cardName,
          houseImages,
        });
      } else {
        savedAddress = await saveAddress({
          fullTextAddress: house,
          location: selectedCoords,
          cardName,
          houseImages,
        });
      }
      if (savedAddress?.publicCode) {
        setPublicCode(savedAddress.publicCode);
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
          <>
            <Text style={styles.fieldLabel}>Card name</Text>
            <TextInput
              value={cardName}
              onChangeText={setCardName}
              placeholder="Home, Work, etc."
              placeholderTextColor="#9ca3af"
              style={styles.input}
            />
            <Text style={styles.fieldLabel}>House / Street / Block (optional)</Text>
            <TextInput
              value={house}
              onChangeText={setHouse}
              placeholder="123 Main St, Block B"
              placeholderTextColor="#9ca3af"
              style={styles.input}
            />
            <Text style={styles.fieldLabel}>Landmarks (optional)</Text>
            <TextInput
              value={landmark}
              onChangeText={setLandmark}
              placeholder="Near the community center"
              placeholderTextColor="#9ca3af"
              style={styles.input}
            />
            <Text style={styles.fieldLabel}>Notes (optional)</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Label this card for drivers"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
              style={[styles.input, styles.notesInput]}
            />
          </>
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
        const displayCode = publicCode || previewCode;
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
            </View>

            {/* Delivery Code Section */}
            <View style={styles.deliveryCodeCard}>
              <Text style={styles.deliveryCodeLabel}>DELIVERY RIDERS WILL USE THIS CODE</Text>
              <View style={styles.deliveryCodeInputContainer}>
                <TextInput
                  value={displayCode}
                  editable={false}
                  style={styles.deliveryCodeInput}
                />
                <Pressable
                  style={styles.deliveryCodeCopyButton}
                  onPress={() => handleCopyCode(displayCode)}>
                  <FontAwesome name="copy" size={16} color="#fff" />
                </Pressable>
              </View>
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
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <FontAwesome name="chevron-left" size={20} color="#111827" />
          </Pressable>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Create Address Card</Text>
            <Text style={styles.headerSubtitle}>Step {currentStep} of {steps.length}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            {steps.map((step, index) => {
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;
              return (
                <View key={step.id} style={styles.progressItem}>
                  <View
                    style={[
                      styles.progressCircle,
                      isActive && styles.progressCircleActive,
                      isCompleted && styles.progressCircleCompleted,
                    ]}>
                    {isCompleted ? (
                      <FontAwesome name="check" size={16} color="#fff" />
                    ) : (
                      <Text
                        style={[
                          styles.progressCircleText,
                          isActive && styles.progressCircleTextActive,
                        ]}>
                        {step.id}
                      </Text>
                    )}
                  </View>
                  {index < steps.length - 1 && (
                    <View
                      style={[
                        styles.progressLine,
                        isCompleted && styles.progressLineCompleted,
                        isActive && styles.progressLineActive,
                      ]}
                    />
                  )}
                </View>
              );
            })}
          </View>

          {/* Main Card */}
          <View style={styles.card}>
            {renderStepContent()}
            
            {currentStep === 1 ? (
              <Pressable style={styles.nextButton} onPress={goNext}>
                <Text style={styles.nextButtonText}>Next: Drop Pin</Text>
              </Pressable>
            ) : null}
          </View>
        </ScrollView>

        {currentStep > 1 && (
          <View style={styles.footer}>
            <Pressable style={styles.backButtonFooter} onPress={goBack}>
              <Text style={styles.backButtonText}>Back</Text>
            </Pressable>

            {currentStep < steps.length ? (
              <Pressable style={styles.nextButtonFooter} onPress={goNext}>
                <Text style={styles.nextButtonTextFooter}>
                  {currentStep === 3 ? 'Next: Review & Save' : 'Next'}
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
            {saveError ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{saveError}</Text>
              </View>
            ) : null}
          </View>
        )}
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
    paddingTop: 16,
    paddingBottom: 12,
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
    color: '#6b7280',
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  progressCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  progressCircleActive: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  progressCircleCompleted: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  progressCircleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  progressCircleTextActive: {
    color: '#fff',
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 4,
  },
  progressLineCompleted: {
    backgroundColor: '#3b82f6',
  },
  progressLineActive: {
    backgroundColor: '#f97316',
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
  nextButton: {
    marginTop: 24,
    alignItems: 'center',
    paddingVertical: 12,
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
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
    borderTopColor: '#e5e7eb',
    backgroundColor: '#fff',
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
  deliveryCodeCard: {
    backgroundColor: '#fff7ed',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  deliveryCodeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9a3412',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  deliveryCodeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryCodeInput: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: '700',
    color: '#9a3412',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#fed7aa',
    marginRight: 12,
  },
  deliveryCodeCopyButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f97316',
    justifyContent: 'center',
    alignItems: 'center',
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
  errorBanner: {
    marginTop: 12,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(220, 38, 38, 0.12)',
    borderWidth: 1,
    borderColor: '#dc2626',
  },
});
