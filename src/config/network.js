// Dynamic network configuration
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Get the development server URL from Expo
const getBaseURL = () => {
  // In development, use Expo's manifest to get the correct IP
  if (__DEV__ && Constants.expoConfig?.hostUri) {
    const host = Constants.expoConfig.hostUri.split(':')[0];
    return `http://${host}:3001`;
  }
  
  // For production or when hostUri is not available, use environment variable or default
  if (Constants.expoConfig?.extra?.API_URL) {
    return Constants.expoConfig.extra.API_URL;
  }
  
  // Fallback for different platforms
  if (Platform.OS === 'android') {
    // Android emulator uses 10.0.2.2 to reach host machine
    return 'http://10.0.2.2:3001';
  } else if (Platform.OS === 'ios') {
    // iOS simulator can use localhost
    return 'http://localhost:3001';
  }
  
  // Default fallback
  return 'http://localhost:3001';
};

export const API_BASE_URL = `${getBaseURL()}/api`;
export const SOCKET_SERVER_URL = getBaseURL();

// Log the URLs for debugging
console.log('🌐 API Base URL:', API_BASE_URL);
console.log('🔌 Socket Server URL:', SOCKET_SERVER_URL);
