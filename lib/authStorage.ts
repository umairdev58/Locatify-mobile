import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { LoginResponse } from '@/api/auth';

const STORAGE_KEY = 'locatify_auth_session_v1';

function readWeb(): string | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeWeb(value: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* ignore quota / private mode */
  }
}

function removeWeb(): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export async function persistAuthSession(data: LoginResponse): Promise<void> {
  const json = JSON.stringify(data);
  if (Platform.OS === 'web') {
    writeWeb(json);
    return;
  }
  await SecureStore.setItemAsync(STORAGE_KEY, json);
}

export async function loadPersistedAuthSession(): Promise<LoginResponse | null> {
  try {
    const raw = Platform.OS === 'web' ? readWeb() : await SecureStore.getItemAsync(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as LoginResponse;
    if (!data?.token || !data?.user?.id || !data.user.accountType) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export async function clearPersistedAuthSession(): Promise<void> {
  if (Platform.OS === 'web') {
    removeWeb();
    return;
  }
  try {
    await SecureStore.deleteItemAsync(STORAGE_KEY);
  } catch {
    /* already missing */
  }
}
