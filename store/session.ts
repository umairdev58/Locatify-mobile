let cachedToken: string | null = null;
let cachedAccountType: 'user' | 'delivery' | null = null;

export function setAuthToken(token: string | null) {
  cachedToken = token;
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
