import { API_BASE_URL } from '@/config/apiConfig';
console.log('API_BASE_URL --->', API_BASE_URL);
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
    console.log('data --->', data);
    throw new Error(data?.message ?? 'Unable to complete request.');
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

export async function forgotPassword(email: string): Promise<{ message: string; expiresIn?: number }> {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  const data = (await response.json().catch(() => ({}))) as { message?: string; expiresIn?: number };

  if (!response.ok) {
    throw new Error(data?.message ?? 'Unable to send reset email');
  }

  return {
    message: data.message ?? 'Reset email sent',
    expiresIn: data.expiresIn,
  };
}

export async function verifyResetCodeApi(payload: {
  email: string;
  code: string;
}): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/verify-reset-code`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => ({}))) as { message?: string };
  if (!response.ok) {
    throw new Error(data?.message ?? 'Unable to verify code');
  }
  return { message: data.message ?? 'Code verified' };
}

export async function resetPasswordApi(payload: {
  email: string;
  code: string;
  newPassword: string;
}): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => ({}))) as { message?: string };
  if (!response.ok) {
    throw new Error(data?.message ?? 'Unable to reset password');
  }
  return { message: data.message ?? 'Password updated' };
}

export async function googleLogin(idToken: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/google-login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ idToken }),
  });

  const data = (await response.json().catch(() => ({}))) as LoginResponse & { message?: string };

  if (!response.ok) {
    throw new Error(data?.message ?? 'Unable to login with Google');
  }

  // Response shape matches LoginResponse
  return data;
}
