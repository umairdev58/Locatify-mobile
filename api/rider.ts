import { API_BASE_URL } from '@/config/apiConfig';

export type RequestOTPPayload = {
  phone: string;
};

export type RequestOTPResponse = {
  message: string;
  phone: string;
  expiresIn: number;
};

export type VerifyOTPPayload = {
  phone: string;
  otp: string;
};

export type VerifyOTPResponse = {
  message: string;
  token: string;
  rider: {
    id: string;
    phone: string;
    phone_verified: boolean;
    status: 'BASIC_VERIFIED' | 'FULL_VERIFIED';
  };
};

export type RiderProfileResponse = {
  rider: {
    id: string;
    phone: string;
    phone_verified: boolean;
    status: 'BASIC_VERIFIED' | 'FULL_VERIFIED';
    created_at: string;
  };
};

async function handleRiderResponse<T>(response: Response): Promise<T> {
  const data = (await response.json().catch(() => ({}))) as T & { message?: string; errors?: any[] };

  if (!response.ok) {
    // Handle validation errors
    if (data.errors && Array.isArray(data.errors)) {
      const errorMessage = data.errors.map((e: any) => e.msg || e.message).join(', ');
      throw new Error(errorMessage || 'Validation error');
    }
    throw new Error(data?.message ?? 'Unable to complete request');
  }

  return data;
}

/**
 * Request OTP for phone number
 */
export async function requestOTP(payload: RequestOTPPayload): Promise<RequestOTPResponse> {
  const response = await fetch(`${API_BASE_URL}/rider/request-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return handleRiderResponse<RequestOTPResponse>(response);
}

/**
 * Verify OTP and authenticate rider
 */
export async function verifyOTP(payload: VerifyOTPPayload): Promise<VerifyOTPResponse> {
  const response = await fetch(`${API_BASE_URL}/rider/verify-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return handleRiderResponse<VerifyOTPResponse>(response);
}

/**
 * Get authenticated rider's profile
 */
export async function getRiderProfile(token: string): Promise<RiderProfileResponse> {
  const response = await fetch(`${API_BASE_URL}/rider/profile`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  return handleRiderResponse<RiderProfileResponse>(response);
}

