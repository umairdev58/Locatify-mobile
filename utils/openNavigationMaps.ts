import { ActionSheetIOS, Linking, Platform } from 'react-native';

/**
 * Opens driving directions to a coordinate.
 * iOS: action sheet to choose Apple Maps or Google Maps.
 * Android: Google Maps (app if available via intent, else browser URL).
 */
export function openNavigationMaps(latitude: number, longitude: number): void {
  const lat = latitude;
  const lng = longitude;

  const appleMapsUrl = `maps://?daddr=${lat},${lng}`;
  const appleMapsWebUrl = `https://maps.apple.com/?daddr=${lat},${lng}`;
  const googleMapsAppUrl = `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`;
  const googleMapsWebUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  const openApple = async () => {
    try {
      const supported = await Linking.canOpenURL(appleMapsUrl);
      await Linking.openURL(supported ? appleMapsUrl : appleMapsWebUrl);
    } catch {
      await Linking.openURL(appleMapsWebUrl);
    }
  };

  const openGoogle = async () => {
    try {
      const supported = await Linking.canOpenURL('comgooglemaps://');
      await Linking.openURL(supported ? googleMapsAppUrl : googleMapsWebUrl);
    } catch {
      await Linking.openURL(googleMapsWebUrl);
    }
  };

  if (Platform.OS === 'android') {
    void Linking.openURL(googleMapsWebUrl);
    return;
  }

  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['Cancel', 'Apple Maps', 'Google Maps'],
        cancelButtonIndex: 0,
        userInterfaceStyle: 'light',
      },
      (buttonIndex) => {
        if (buttonIndex === 1) {
          void openApple();
        } else if (buttonIndex === 2) {
          void openGoogle();
        }
      },
    );
    return;
  }

  void Linking.openURL(googleMapsWebUrl);
}
