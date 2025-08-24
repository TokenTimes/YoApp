import React, { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import ApiService from "../services/api";
import SoundService from "../services/sound";

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tokens, setTokens] = useState({
    accessToken: null,
    refreshToken: null,
  });

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [storedAccessToken, storedRefreshToken, storedUser] =
        await Promise.all([
          SecureStore.getItemAsync("accessToken"),
          SecureStore.getItemAsync("refreshToken"),
          SecureStore.getItemAsync("user"),
        ]);

      if (storedAccessToken && storedRefreshToken && storedUser) {
        const userObj = JSON.parse(storedUser);
        setTokens({
          accessToken: storedAccessToken,
          refreshToken: storedRefreshToken,
        });
        setUser(userObj);

        // Set the token in ApiService
        ApiService.setAuthToken(storedAccessToken);
        // Set up auto-refresh callback
        ApiService.setRefreshCallback(refreshAccessToken);

        // Initialize sound service immediately after successful auth
        await SoundService.initializeSound();
      }
    } catch (error) {
      console.error("Error loading stored auth:", error);
      await clearAuth();
    } finally {
      setIsLoading(false);
    }
  };

  const saveAuth = async (userData, accessToken, refreshToken) => {
    try {
      await Promise.all([
        SecureStore.setItemAsync("accessToken", accessToken),
        SecureStore.setItemAsync("refreshToken", refreshToken),
        SecureStore.setItemAsync("user", JSON.stringify(userData)),
      ]);

      setTokens({ accessToken, refreshToken });
      setUser(userData);
      ApiService.setAuthToken(accessToken);
      // Set up auto-refresh callback
      ApiService.setRefreshCallback(refreshAccessToken);
    } catch (error) {
      console.error("Error saving auth:", error);
      throw error;
    }
  };

  const clearAuth = async () => {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync("accessToken"),
        SecureStore.deleteItemAsync("refreshToken"),
        SecureStore.deleteItemAsync("user"),
      ]);

      setTokens({ accessToken: null, refreshToken: null });
      setUser(null);
      ApiService.clearAuthToken();
      ApiService.setRefreshCallback(null);
    } catch (error) {
      console.error("Error clearing auth:", error);
    }
  };

  const signup = async (username, email, password) => {
    try {
      const response = await ApiService.signup(username, email, password);
      await saveAuth(
        response.user,
        response.accessToken,
        response.refreshToken
      );

      // Initialize sound service immediately after successful signup
      await SoundService.initializeSound();

      return response;
    } catch (error) {
      throw error;
    }
  };

  const login = async (identifier, password) => {
    try {
      const response = await ApiService.login(identifier, password);
      await saveAuth(
        response.user,
        response.accessToken,
        response.refreshToken
      );

      // Initialize sound service immediately after successful login
      await SoundService.initializeSound();

      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    // Clean up sound service before clearing auth
    await SoundService.cleanup();
    await clearAuth();
  };

  const refreshAccessToken = async () => {
    try {
      if (!tokens.refreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await ApiService.refreshToken(tokens.refreshToken);
      const newAccessToken = response.accessToken;

      await SecureStore.setItemAsync("accessToken", newAccessToken);
      setTokens((prev) => ({ ...prev, accessToken: newAccessToken }));
      ApiService.setAuthToken(newAccessToken);

      return newAccessToken;
    } catch (error) {
      console.error("Error refreshing token:", error);
      await logout(); // Clear all auth data on refresh failure
      throw error;
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    tokens,
    signup,
    login,
    logout,
    refreshAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
