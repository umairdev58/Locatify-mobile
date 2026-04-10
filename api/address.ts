import { API_BASE_URL } from '@/config/apiConfig';
import { getAuthToken } from '@/store/session';
import type { ImageAsset } from '@/types/image';

export type LocationPayload = {
  latitude: number;
  longitude: number;
};

export type SaveAddressPayload = {
  fullTextAddress: string;
  location: LocationPayload;
  cardName?: string;
  landmark?: string;
  notes?: string;
  houseImages?: ImageAsset[];
  addressId?: string;
};

export type SharedFromUserPreview = {
  _id: string;
  name: string;
  email: string;
};

export type AddressResponse = {
  _id: string;
  fullTextAddress: string;
  landmark?: string;
  notes?: string;
  cardName: string;
  location: LocationPayload;
  houseImages: string[];
  publicCode: string;
  /** Present when this card was saved from another user's share */
  sharedFromUser?: SharedFromUserPreview | null;
};

const requireToken = (token?: string) => {
  const authToken = token ?? getAuthToken();
  if (!authToken) {
    throw new Error('Authentication required. Please login first.');
  }
  return authToken;
};

const buildPayload = (payload: SaveAddressPayload) => ({
  fullTextAddress: payload.fullTextAddress,
  location: payload.location,
  cardName: payload.cardName,
  landmark: payload.landmark ?? '',
  notes: payload.notes ?? '',
  addressId: payload.addressId,
  houseImages: payload.houseImages
    ?.filter((img) => typeof img.base64 === 'string' && img.base64.length > 0)
    .map(({ base64, name, type }) => ({
      base64: base64 as string,
      name,
      type,
    })),
});

const sendJsonPayload = async (
  url: string,
  method: 'POST' | 'PUT',
  payload: SaveAddressPayload,
  token?: string,
  action = 'save address',
): Promise<AddressResponse> => {
  const authToken = requireToken(token);
  try {
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildPayload(payload)),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.message ?? `Unable to ${action}`);
    }

    return data as AddressResponse;
  } catch (error) {
    console.error(`Address API ${method} ${url} failed`, error);
    const message = error instanceof Error ? error.message : 'Network request failed';
    throw new Error(`Network request failed while ${action}: ${message}`);
  }
};

export async function saveAddress(payload: SaveAddressPayload, token?: string) {
  return sendJsonPayload(`${API_BASE_URL}/address/save`, 'POST', payload, token, 'save address');
}

export async function getMyAddresses(token?: string): Promise<AddressResponse[] | null> {
  const authToken = token ?? getAuthToken();
  if (!authToken) {
    return null;
  }

  const response = await fetch(`${API_BASE_URL}/address/me`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (response.status === 404) {
    return [];
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message ?? 'Unable to fetch addresses');
  }

  return data as AddressResponse[];
}

export async function getAddressByCode(code: string) {
  if (!code) {
    throw new Error('Public code is required');
  }
  const response = await fetch(`${API_BASE_URL}/address/${code}`);

  if (response.status === 404) {
    throw new Error('Address not found');
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message ?? 'Unable to fetch address');
  }
  return data as AddressResponse;
}

export async function updateAddress(addressId: string, payload: SaveAddressPayload, token?: string) {
  const mergedPayload = { ...payload, addressId };
  return sendJsonPayload(`${API_BASE_URL}/address/update`, 'PUT', mergedPayload, token, 'update address');
}

export async function deleteAddress(addressId: string, token?: string): Promise<void> {
  const authToken = requireToken(token);
  try {
    const response = await fetch(`${API_BASE_URL}/address/${addressId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.message ?? 'Unable to delete address');
    }
  } catch (error) {
    console.error('Address API DELETE failed', error);
    const message = error instanceof Error ? error.message : 'Network request failed';
    throw new Error(`Network request failed while deleting address: ${message}`);
  }
}
