import { Platform } from 'react-native';

/**
 * API origin for all fetch calls. Resolution order:
 * 1. EXPO_PUBLIC_API_BASE_URL — set in `.env` (local) or EAS / Expo dashboard (preview & production).
 * 2. __DEV__ — emulator-friendly localhost when unset (Android emulator uses 10.0.2.2).
 * 3. Release default — HTTPS; override with EXPO_PUBLIC_API_BASE_URL for your canonical API host.
 */
function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

const DEFAULT_PRODUCTION_API_BASE_URL =
  'https://api.locatify.org/api';

function localDevBaseUrl(): string {
  const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  return `http://${host}:8000/api`;
}

function resolveApiBaseUrl(): string {
  if (fromEnv) {
    return normalizeBaseUrl(fromEnv);
  }
  if (__DEV__) {
    return localDevBaseUrl();
  }
  return DEFAULT_PRODUCTION_API_BASE_URL;
}

export const API_BASE_URL = resolveApiBaseUrl();
