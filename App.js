// Main App Component
import React from "react";
import { View, StyleSheet, ActivityIndicator, Text } from "react-native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";

import { AuthProvider, useAuth } from "./src/context/AuthContext";
import AuthStack from "./src/navigation/AuthStack";
import MainStack from "./src/navigation/MainStack";

// App content component that uses auth context
const AppContent = () => {
  const { user, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" backgroundColor="#713790" />
        <ActivityIndicator size="large" color="#713790" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" backgroundColor="#713790" />
      {user ? <MainStack user={user} onLogout={logout} /> : <AuthStack />}
    </NavigationContainer>
  );
};

// Main App component with providers
export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#713790",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#713790",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 10,
  },
});
