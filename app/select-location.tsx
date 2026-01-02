import { Pressable, StyleSheet, View } from 'react-native';
import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import AccountGuard from '@/components/AccountGuard';
import MapLocationPicker from '@/components/MapLocationPicker';
import { Text } from '@/components/Themed';

export default function SelectLocationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ redirect?: string }>();
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const handleConfirm = () => {
    if (!selectedLocation) return;
    const destination = params.redirect ?? '/add-address';
    router.replace({
      pathname: destination,
      params: {
        lat: selectedLocation.latitude.toString(),
        lng: selectedLocation.longitude.toString(),
      },
    });
  };

  return (
    <AccountGuard required="user">
      <View style={styles.screen}>
        <Text style={styles.title}>Choose a location</Text>
        <Text style={styles.subtitle}>Tap on the map and confirm when you're ready.</Text>
        <MapLocationPicker onLocationSelect={setSelectedLocation} />
        <View style={styles.footer}>
          <View style={styles.coordsContainer}>
            <Text style={styles.coordsLabel}>Coordinates</Text>
            <Text style={styles.coordsValue}>
              {selectedLocation
                ? `${selectedLocation.latitude.toFixed(5)} · ${selectedLocation.longitude.toFixed(5)}`
                : 'No location selected yet'}
            </Text>
          </View>
          <Pressable
            style={[styles.confirmButton, !selectedLocation && styles.confirmDisabled]}
            onPress={handleConfirm}
            disabled={!selectedLocation}>
            <Text style={styles.confirmText}>Confirm Location</Text>
          </Pressable>
        </View>
      </View>
    </AccountGuard>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f6f7ff',
    padding: 16,
  },
  title: {
    marginTop: 12,
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    color: '#6f6f87',
    marginBottom: 16,
  },
  footer: {
    marginTop: 16,
  },
  coordsContainer: {
    marginBottom: 12,
  },
  coordsLabel: {
    fontSize: 12,
    color: '#8b8ba7',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  coordsValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#5d5cff',
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
  },
  confirmDisabled: {
    opacity: 0.5,
  },
  confirmText: {
    color: '#fff',
    fontWeight: '600',
  },
});
