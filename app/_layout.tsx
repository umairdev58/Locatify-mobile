import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';
import 'react-native-reanimated';

import { loadPersistedAuthSession } from '@/lib/authStorage';
import { useColorScheme } from '@/components/useColorScheme';
import { ToastProvider } from '@/components/ToastProvider';
import { hydrateSessionFromStorage } from '@/store/session';

/** Must match app.json `splash.backgroundColor` and expo-splash-screen plugin */
const SPLASH_BACKGROUND = '#c5d8e8';
const SPLASH_LOGO_DISPLAY_SIZE = 260;

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
if (Platform.OS === 'ios') {
  SplashScreen.setOptions({ fade: true, duration: 380 });
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });
  const [authReady, setAuthReady] = useState(false);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const saved = await loadPersistedAuthSession();
      if (!cancelled && saved) {
        hydrateSessionFromStorage(saved);
      }
      if (!cancelled) {
        setAuthReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (loaded && authReady) {
      SplashScreen.hideAsync();
    }
  }, [loaded, authReady]);

  if (!loaded || !authReady) {
    /* Same look as native splash: Expo Go (SDK 52+) only shows app icon natively, so we paint our logo here once JS runs. */
    return (
      <View style={splashStyles.container}>
        <Image
          source={require('../assets/images/splash-icon.png')}
          style={splashStyles.logo}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
      </View>
    );
  }

  return <RootLayoutNav />;
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SPLASH_BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: SPLASH_LOGO_DISPLAY_SIZE,
    height: SPLASH_LOGO_DISPLAY_SIZE,
  },
});

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ToastProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }} initialRouteName="index" />
      </ThemeProvider>
    </ToastProvider>
  );
}
