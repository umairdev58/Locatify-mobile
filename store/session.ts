let cachedToken: string | null = null;
let cachedAccountType: 'user' | 'delivery' | 'rider' | null = null;
let cachedRiderToken: string | null = null;

export function setAuthToken(token: string | null) {
  cachedToken = token;
}

export function getAuthToken() {
  return cachedToken;
}

export function setAccountType(type: 'user' | 'delivery' | 'rider' | null) {
  cachedAccountType = type;
}

export function getAccountType() {
  return cachedAccountType;
}

export function setRiderToken(token: string | null) {
  cachedRiderToken = token;
  if (token) {
    cachedAccountType = 'rider';
  }
}

export function getRiderToken() {
  return cachedRiderToken;
}
