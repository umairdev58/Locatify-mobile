import { Platform } from 'react-native';

// Deployed backend URL (AWS EC2 instance)
const DEPLOYED_API_BASE_URL = 'http://13.203.161.203:5000/api';
const azure_api_base_url = 'https://locatify-api.azurewebsites.net/api';
// Local development URLs
const LOCAL_API_BASE_URL =
  Platform.OS === 'android' ? 'http://192.168.10.10:8000/api' : 'http://localhost:8000/api';

// Use environment variable if set, otherwise use deployed URL by default
// // To use local development, set EXPO_PUBLIC_API_BASE_URL in your .env file
// export const API_BASE_URL =azure_api_base_url ??
//  LOCAL_API_BASE_URL ?? DEPLOYED_API_BASE_URL  ;

export const API_BASE_URL =
 LOCAL_API_BASE_URL ?? azure_api_base_url ?? DEPLOYED_API_BASE_URL  ;
