let cachedToken: string | null = null;
let cachedAccountType: 'user' | 'delivery' | null = null;
let cachedUserProfile: {
  id: string;
  name: string;
  email: string;
  accountType: 'user' | 'delivery';
} | null = null;

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
