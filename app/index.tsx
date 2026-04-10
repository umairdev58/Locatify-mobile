import { Redirect } from 'expo-router';

import { getAccountType, getAuthToken } from '@/store/session';

/**
 * App entry: sends logged-in users to the right home, others to login.
 * Session is restored from secure storage in root `_layout` before this renders.
 */
export default function Index() {
  const token = getAuthToken();
  if (!token) {
    return <Redirect href="/login" />;
  }

  const accountType = getAccountType();
  if (accountType === 'delivery') {
    return <Redirect href="/delivery-search" />;
  }

  return <Redirect href="/(tabs)" />;
}
