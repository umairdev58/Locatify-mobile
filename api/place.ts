import { API_BASE_URL } from '@/config/apiConfig';
import { getAuthToken } from '@/store/session';

export type LocationPayload = {
  latitude: number;
  longitude: number;
};

export type SavePlacePayload = {
  name: string;
  notes?: string;
  location: LocationPayload;
  placeId?: string;
};

export type PlaceResponse = {
  _id: string;
  name: string;
  notes: string;
  location: LocationPayload;
  createdAt: string;
  updatedAt: string;
};

const requireToken = (token?: string) => {
  const authToken = token ?? getAuthToken();
  if (!authToken) {
    throw new Error('Authentication required. Please login first.');
  }
  return authToken;
};

export async function savePlace(payload: SavePlacePayload, token?: string): Promise<PlaceResponse> {
  const authToken = requireToken(token);
  try {
    const response = await fetch(`${API_BASE_URL}/place/save`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: payload.name,
        notes: payload.notes || '',
        location: payload.location,
      }),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.message ?? 'Unable to save place');
    }

    return data as PlaceResponse;
  } catch (error) {
    console.error('Place API POST failed', error);
    const message = error instanceof Error ? error.message : 'Network request failed';
    throw new Error(`Network request failed while saving place: ${message}`);
  }
}

export async function getMyPlaces(token?: string): Promise<PlaceResponse[] | null> {
  const authToken = token ?? getAuthToken();
  if (!authToken) {
    return null;
  }

  const response = await fetch(`${API_BASE_URL}/place/me`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (response.status === 404) {
    return [];
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message ?? 'Unable to fetch places');
  }

  return data as PlaceResponse[];
}

export async function updatePlace(payload: SavePlacePayload, token?: string): Promise<PlaceResponse> {
  const authToken = requireToken(token);
  try {
    const response = await fetch(`${API_BASE_URL}/place/update`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        placeId: payload.placeId,
        name: payload.name,
        notes: payload.notes || '',
        location: payload.location,
      }),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.message ?? 'Unable to update place');
    }

    return data as PlaceResponse;
  } catch (error) {
    console.error('Place API PUT failed', error);
    const message = error instanceof Error ? error.message : 'Network request failed';
    throw new Error(`Network request failed while updating place: ${message}`);
  }
}

export async function deletePlace(placeId: string, token?: string): Promise<void> {
  const authToken = requireToken(token);
  try {
    const response = await fetch(`${API_BASE_URL}/place/${placeId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.message ?? 'Unable to delete place');
    }
  } catch (error) {
    console.error('Place API DELETE failed', error);
    const message = error instanceof Error ? error.message : 'Network request failed';
    throw new Error(`Network request failed while deleting place: ${message}`);
  }
}

