import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { StyleSheet, View, type ViewStyle } from 'react-native';

type Props = {
  latitude: number;
  longitude: number;
  style?: ViewStyle;
  toolbarEnabled?: boolean;
};

export default function EmbeddedMapPreview({
  latitude,
  longitude,
  style,
  toolbarEnabled = false,
}: Props) {
  const region: Region = {
    latitude,
    longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <View style={[styles.fill, style]}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        region={region}
        toolbarEnabled={toolbarEnabled}>
        <Marker coordinate={{ latitude, longitude }} />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
