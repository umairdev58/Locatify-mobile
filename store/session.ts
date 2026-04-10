import type { LoginResponse } from '@/api/auth';
import {
  clearPersistedAuthSession,
  persistAuthSession,
} from '@/lib/authStorage';

let cachedToken: string | null = null;
let cachedAccountType: 'user' | 'delivery' | null = null;
let cachedUserProfile: {
  id: string;
  name: string;
  email: string;
  accountType: 'user' | 'delivery';
} | null = null;

/** Call after email/password, Google, or register success — persists securely for next app launch. */
export function applyAuthSession(data: LoginResponse) {
  setAuthToken(data.token);
  setUserProfile(data.user);
  void persistAuthSession(data);
}

/** Restore session from secure storage on cold start (does not re-write storage). */
export function hydrateSessionFromStorage(data: LoginResponse) {
  setAuthToken(data.token);
  setUserProfile(data.user);
}

export async function clearAuthSession() {
  setAuthToken(null);
  await clearPersistedAuthSession();
}

export function setAuthToken(token: string | null) {
  cachedToken = token;
  if (!token) {
    cachedUserProfile = null;
    cachedAccountType = null;
  }
}

export function getAuthToken() {
  return cachedToken;
}

export function setAccountType(type: 'user' | 'delivery' | null) {
  cachedAccountType = type;
}

export function getAccountType() {
  return cachedAccountType;
}

export function setUserProfile(user: {
  id: string;
  name: string;
  email: string;
  accountType: 'user' | 'delivery';
} | null) {
  cachedUserProfile = user;
  if (user) {
    cachedAccountType = user.accountType;
  }
}

export function getUserProfile() {
  return cachedUserProfile;
}
