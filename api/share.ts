import { authenticatedFetch } from '@/api/authenticatedFetch';
import { API_BASE_URL } from '@/config/apiConfig';
import { getAuthToken } from '@/store/session';
import type { AddressResponse } from '@/api/address';

export type ShareUserPreview = {
  _id: string;
  name: string;
  email: string;
};

export type AddressShareResponse = {
  _id: string;
  fromUser: ShareUserPreview;
  toUser: ShareUserPreview;
  sourceAddress: AddressResponse | null;
  status: 'pending' | 'accepted' | 'declined';
  createdAddress?: string | null;
  createdAt?: string;
};

function requireToken(token?: string) {
  const authToken = token ?? getAuthToken();
  if (!authToken) {
    throw new Error('Authentication required. Please login first.');
  }
  return authToken;
}

export async function createAddressShare(
  addressId: string,
  recipientEmail: string,
  token?: string,
): Promise<AddressShareResponse> {
  const authToken = requireToken(token);
  const response = await authenticatedFetch(`${API_BASE_URL}/share`, authToken, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ addressId, recipientEmail: recipientEmail.trim() }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message ?? 'Unable to send share');
  }
  return data as AddressShareResponse;
}

export async function getIncomingShares(token?: string): Promise<AddressShareResponse[]> {
  const authToken = requireToken(token);
  const response = await authenticatedFetch(`${API_BASE_URL}/share/incoming`, authToken, {});
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message ?? 'Unable to load invitations');
  }
  return data as AddressShareResponse[];
}

export async function getOutgoingShares(token?: string): Promise<AddressShareResponse[]> {
  const authToken = requireToken(token);
  const response = await authenticatedFetch(`${API_BASE_URL}/share/outgoing`, authToken, {});
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message ?? 'Unable to load sent shares');
  }
  return data as AddressShareResponse[];
}

export async function acceptShare(shareId: string, token?: string) {
  const authToken = requireToken(token);
  const response = await authenticatedFetch(`${API_BASE_URL}/share/${shareId}/accept`, authToken, {
    method: 'POST',
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message ?? 'Unable to accept share');
  }
  return data as { share: AddressShareResponse; address: AddressResponse };
}

export async function declineShare(shareId: string, token?: string) {
  const authToken = requireToken(token);
  const response = await authenticatedFetch(`${API_BASE_URL}/share/${shareId}/decline`, authToken, {
    method: 'POST',
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message ?? 'Unable to decline share');
  }
  return data;
}
