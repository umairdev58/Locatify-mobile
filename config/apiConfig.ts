import { Platform } from 'react-native';

// Defaults to the local host for web/iOS and the Android emulator loopback.
const DEFAULT_API_BASE_URL =
  Platform.OS === 'android' ? 'http://192.168.10.28:8000/api' : 'http://localhost:8000/api';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL;
