// Login Screen Component
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import ApiService from "../services/api";
import PushNotificationService from "../services/pushNotifications";
import { StorageService } from "../utils/storage";

const LoginScreen = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Check if user is already logged in
      const savedUsername = await StorageService.getUsername();
      if (savedUsername) {
        setUsername(savedUsername);
        // Auto-login with saved username
        await handleLogin(savedUsername, true);
      }
    } catch (error) {
      console.error("Error initializing app:", error);
    } finally {
      setInitializing(false);
    }
  };

  const handleLogin = async (
    usernameToLogin = username,
    isAutoLogin = false
  ) => {
    if (!usernameToLogin.trim()) {
      Alert.alert("Error", "Please enter a username");
      return;
    }

    setLoading(true);

    try {
      // Initialize push notifications and get push token
      const expoPushToken = await PushNotificationService.initialize();

      // Login/register user
      const response = await ApiService.loginUser(
        usernameToLogin.trim(),
        expoPushToken
      );

      if (response.success) {
        // Save user data locally
        await StorageService.saveUsername(usernameToLogin.trim());
        await StorageService.saveUserData(response.user);
        if (expoPushToken) {
          await StorageService.saveExpoPushToken(expoPushToken);
        }

        // Call parent callback to navigate to main screen
        onLogin(response.user);

        if (!isAutoLogin) {
          Alert.alert("Success", `Welcome ${response.user.username}!`);
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to login. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Initializing...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style="light" backgroundColor="#6366f1" />

      <View style={styles.header}>
        <Text style={styles.title}>Yo!</Text>
        <Text style={styles.subtitle}>Send instant Yos to your friends</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Enter your username</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="Username"
          placeholderTextColor="#94a3b8"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={50}
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={() => handleLogin()}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Login / Sign Up</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.helpText}>
          If you're new, we'll create an account for you automatically!
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#6366f1",
    justifyContent: "center",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 50,
  },
  title: {
    fontSize: 72,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: "#e2e8f0",
    textAlign: "center",
  },
  form: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    color: "#1f2937",
  },
  button: {
    backgroundColor: "#6366f1",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    marginBottom: 15,
  },
  buttonDisabled: {
    backgroundColor: "#94a3b8",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  helpText: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 10,
    textAlign: "center",
  },
});

export default LoginScreen;
