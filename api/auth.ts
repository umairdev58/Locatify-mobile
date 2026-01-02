import { API_BASE_URL } from '@/config/apiConfig';

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  accountType: 'delivery' | 'user';
};

export type LoginResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    accountType: 'user' | 'delivery';
  };
};

async function handleAuthResponse(response: Response): Promise<LoginResponse> {
  const data = (await response.json().catch(() => ({}))) as LoginResponse & { message?: string };

  if (!response.ok) {
    throw new Error(data?.message ?? 'Unable to complete request');
  }

  return data;
}

export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return handleAuthResponse(response);
}

export async function registerUser(payload: RegisterPayload): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return handleAuthResponse(response);
}
