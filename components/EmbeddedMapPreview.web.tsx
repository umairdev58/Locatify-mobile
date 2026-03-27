import { Linking, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

type Props = {
  latitude: number;
  longitude: number;
  style?: ViewStyle;
};

export default function EmbeddedMapPreview({ latitude, longitude, style }: Props) {
  const openMaps = () => {
    Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
    );
  };

  return (
    <View style={[styles.wrap, style]}>
      <Text style={styles.coords}>
        {latitude.toFixed(5)}, {longitude.toFixed(5)}
      </Text>
      <Text style={styles.sub}>Full map is available in the mobile app.</Text>
      <Pressable onPress={openMaps} style={styles.btn}>
        <Text style={styles.btnText}>Open in Google Maps</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: '#e8ecff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  coords: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'monospace',
  },
  sub: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
  },
  btn: {
    marginTop: 8,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
