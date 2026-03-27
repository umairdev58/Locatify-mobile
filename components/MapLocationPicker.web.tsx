import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const DEFAULT_COORDINATES = { latitude: 31.5204, longitude: 74.3587 };

type Props = {
  onLocationSelect: (coords: { latitude: number; longitude: number }) => void;
  initialLocation?: { latitude: number; longitude: number };
};

export default function MapLocationPicker({ onLocationSelect, initialLocation }: Props) {
  const [lat, setLat] = useState(
    String(initialLocation?.latitude ?? DEFAULT_COORDINATES.latitude),
  );
  const [lng, setLng] = useState(
    String(initialLocation?.longitude ?? DEFAULT_COORDINATES.longitude),
  );
  const [loading, setLoading] = useState(!initialLocation);

  useEffect(() => {
    if (initialLocation) {
      onLocationSelect(initialLocation);
      setLoading(false);
      return;
    }

    let mounted = true;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          onLocationSelect(DEFAULT_COORDINATES);
          return;
        }
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
        });
        if (!mounted) return;
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setLat(String(coords.latitude));
        setLng(String(coords.longitude));
        onLocationSelect(coords);
      } catch {
        onLocationSelect(DEFAULT_COORDINATES);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [initialLocation, onLocationSelect]);

  const apply = () => {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    if (!Number.isNaN(latitude) && !Number.isNaN(longitude)) {
      onLocationSelect({ latitude, longitude });
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#5d5cff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>
        Interactive maps are not available in the browser. Enter latitude and longitude, or test on
        iOS/Android.
      </Text>
      <TextInput
        style={styles.input}
        value={lat}
        onChangeText={setLat}
        keyboardType="decimal-pad"
        placeholder="Latitude"
        placeholderTextColor="#9ca3af"
      />
      <TextInput
        style={styles.input}
        value={lng}
        onChangeText={setLng}
        keyboardType="decimal-pad"
        placeholder="Longitude"
        placeholderTextColor="#9ca3af"
      />
      <Pressable style={styles.button} onPress={apply}>
        <Text style={styles.buttonText}>Use these coordinates</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 280,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#e8ecff',
    padding: 16,
    justifyContent: 'center',
    gap: 12,
  },
  loader: {
    height: 280,
    borderRadius: 24,
    backgroundColor: '#111227',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hint: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  button: {
    backgroundColor: '#5d5cff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});
