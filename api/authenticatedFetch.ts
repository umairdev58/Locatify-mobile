import { router } from 'expo-router';

import { clearAuthSession } from '@/store/session';

let handling401 = false;

/**
 * Authenticated API requests. On 401 with a bearer token, clears stored session and sends user to login.
 */
export async function authenticatedFetch(
  url: string,
  authToken: string,
  init?: RequestInit,
): Promise<Response> {
  const headers = new Headers(init?.headers);
  headers.set('Authorization', `Bearer ${authToken}`);
  const response = await fetch(url, { ...init, headers });

  if (response.status === 401 && authToken) {
    if (!handling401) {
      handling401 = true;
      void clearAuthSession()
        .then(() => {
          router.replace('/login');
        })
        .finally(() => {
          handling401 = false;
        });
    }
  }

  return response;
}
