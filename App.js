// Main App Component
import React, { useState, useEffect } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { StatusBar } from "expo-status-bar";
import Toast from "react-native-toast-message";
import LoginScreen from "./src/screens/LoginScreen";
import MainScreen from "./src/screens/MainScreen";
import { StorageService } from "./src/utils/storage";

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAutoLogin();
  }, []);

  const checkAutoLogin = async () => {
    try {
      const savedUsername = await StorageService.getUsername();
      const savedUserData = await StorageService.getUserData();

      if (savedUsername && savedUserData) {
        setCurrentUser(savedUserData);
      }
    } catch (error) {
      console.error("Error checking auto login:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" backgroundColor="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#6366f1" />
      {currentUser ? (
        <MainScreen user={currentUser} onLogout={handleLogout} />
      ) : (
        <LoginScreen onLogin={handleLogin} />
      )}
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#6366f1",
  },
});
