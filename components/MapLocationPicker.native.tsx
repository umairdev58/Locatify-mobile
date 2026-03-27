import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View, Text } from 'react-native';

// Google Maps API key needs to be added per platform:
// - Android: app.json -> android.config.googleMaps.apiKey
// - iOS: app.json -> ios.config.googleMaps.apiKey
// Alternatively, inject via environment variables and expo config plugins.

const DEFAULT_COORDINATES = { latitude: 31.5204, longitude: 74.3587 };

const toRegion = (coords: { latitude: number; longitude: number }): Region => ({
  ...coords,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
});

const DEFAULT_REGION = toRegion(DEFAULT_COORDINATES);

type Props = {
  onLocationSelect: (coords: { latitude: number; longitude: number }) => void;
  initialLocation?: { latitude: number; longitude: number };
};

export default function MapLocationPicker({ onLocationSelect, initialLocation }: Props) {
  const [region, setRegion] = useState<Region | null>(
    initialLocation ? toRegion(initialLocation) : null,
  );
  const [selectedLocation, setSelectedLocation] = useState(initialLocation ?? DEFAULT_COORDINATES);
  const [loading, setLoading] = useState(!initialLocation);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<MapView | null>(null);

  useEffect(() => {
    if (initialLocation) {
      const nextRegion = toRegion(initialLocation);
      setRegion(nextRegion);
      setSelectedLocation(initialLocation);
      onLocationSelect(initialLocation);
      setLoading(false);
      return;
    }

    let mounted = true;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Permission denied. Falling back to default city.');
          setRegion(DEFAULT_REGION);
          setSelectedLocation(DEFAULT_COORDINATES);
          onLocationSelect(DEFAULT_COORDINATES);
          return;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
        });

        if (!mounted) return;

        const nextRegion = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setRegion(nextRegion);
        setSelectedLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        onLocationSelect({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      } catch (err) {
        setError('Unable to fetch location. Showing default.');
        setRegion(DEFAULT_REGION);
        setSelectedLocation(DEFAULT_COORDINATES);
        onLocationSelect(DEFAULT_COORDINATES);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [initialLocation, onLocationSelect]);

  const handleMapPress = (event: {
    nativeEvent: { coordinate: { latitude: number; longitude: number } };
  }) => {
    const coords = event.nativeEvent.coordinate;
    const nextRegion = toRegion(coords);
    setRegion(nextRegion);
    setSelectedLocation(coords);
    onLocationSelect(coords);
  };

  const handleRegionChangeComplete = (nextRegion: Region) => {
    setRegion(nextRegion);
  };

  if (loading || !region) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#5d5cff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={(ref) => {
          mapRef.current = ref;
        }}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE}
        showsUserLocation
        showsMyLocationButton
        region={region}
        onRegionChangeComplete={handleRegionChangeComplete}
        onPress={handleMapPress}>
        <Marker coordinate={selectedLocation} />
      </MapView>
      {error && (
        <View style={styles.error}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
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
  },
  loader: {
    height: 280,
    borderRadius: 24,
    backgroundColor: '#111227',
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  errorText: {
    color: '#5d5cff',
    textAlign: 'center',
  },
});
