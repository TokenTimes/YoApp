// AsyncStorage utility for local data persistence
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  USERNAME: "username",
  USER_DATA: "userData",
  EXPO_PUSH_TOKEN: "expoPushToken",
};

export const StorageService = {
  // Save username
  async saveUsername(username) {
    try {
      await AsyncStorage.setItem(KEYS.USERNAME, username);
    } catch (error) {
      console.error("Error saving username:", error);
    }
  },

  // Get username
  async getUsername() {
    try {
      return await AsyncStorage.getItem(KEYS.USERNAME);
    } catch (error) {
      console.error("Error getting username:", error);
      return null;
    }
  },

  // Save user data
  async saveUserData(userData) {
    try {
      await AsyncStorage.setItem(KEYS.USER_DATA, JSON.stringify(userData));
    } catch (error) {
      console.error("Error saving user data:", error);
    }
  },

  // Get user data
  async getUserData() {
    try {
      const data = await AsyncStorage.getItem(KEYS.USER_DATA);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Error getting user data:", error);
      return null;
    }
  },

  // Save Expo push token
  async saveExpoPushToken(token) {
    try {
      await AsyncStorage.setItem(KEYS.EXPO_PUSH_TOKEN, token);
    } catch (error) {
      console.error("Error saving push token:", error);
    }
  },

  // Get Expo push token
  async getExpoPushToken() {
    try {
      return await AsyncStorage.getItem(KEYS.EXPO_PUSH_TOKEN);
    } catch (error) {
      console.error("Error getting push token:", error);
      return null;
    }
  },

  // Clear all data
  async clearAll() {
    try {
      await AsyncStorage.multiRemove([
        KEYS.USERNAME,
        KEYS.USER_DATA,
        KEYS.EXPO_PUSH_TOKEN,
      ]);
    } catch (error) {
      console.error("Error clearing storage:", error);
    }
  },
};

