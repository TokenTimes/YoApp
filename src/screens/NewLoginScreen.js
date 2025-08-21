import React, { useState } from "react";
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
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "../context/AuthContext";

const NewLoginScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  // Validation functions
  const validateIdentifier = (identifier) => {
    if (!identifier) return "Username or email is required";
    return null;
  };

  const validatePassword = (password) => {
    if (!password) return "Password is required";
    return null;
  };

  // Update form data and validate on change
  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field if it was previously invalid
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  // Handle field blur (show validation)
  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    let error = null;
    switch (field) {
      case "identifier":
        error = validateIdentifier(formData.identifier);
        break;
      case "password":
        error = validatePassword(formData.password);
        break;
    }

    if (error) {
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  // Check if form is valid
  const isFormValid = () => {
    const identifierError = validateIdentifier(formData.identifier);
    const passwordError = validatePassword(formData.password);

    return !identifierError && !passwordError;
  };

  // Map server error codes to user-friendly messages
  const getErrorMessage = (errorCode) => {
    const errorMessages = {
      invalid_credentials: "Wrong username/email or password.",
      user_not_found: "User not found.",
      missing_fields: "Please fill in all fields.",
      server_error: "Something went wrong. Please try again.",
    };

    return errorMessages[errorCode] || "An unexpected error occurred.";
  };

  const handleLogin = async () => {
    // Validate all fields
    const identifierError = validateIdentifier(formData.identifier);
    const passwordError = validatePassword(formData.password);

    const newErrors = {};
    if (identifierError) newErrors.identifier = identifierError;
    if (passwordError) newErrors.password = passwordError;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched({ identifier: true, password: true });
      return;
    }

    setLoading(true);

    try {
      await login(formData.identifier, formData.password);
      // Navigation will be handled by App.js based on auth state
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage = getErrorMessage(error.message);

      // Show inline error for invalid credentials
      if (error.message === "invalid_credentials") {
        setErrors({ password: errorMessage });
      } else {
        // Show general error
        Alert.alert("Login Failed", errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <StatusBar style="light" backgroundColor="#713790" />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Yo</Text>
          <Text style={styles.subtitle}>Welcome back! Sign in to continue</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Username or Email</Text>
            <TextInput
              style={[
                styles.input,
                errors.identifier && touched.identifier && styles.inputError,
              ]}
              value={formData.identifier}
              onChangeText={(value) => updateFormData("identifier", value)}
              onBlur={() => handleBlur("identifier")}
              placeholder="Enter your username or email"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              editable={!loading}
            />
            {errors.identifier && touched.identifier && (
              <Text style={styles.errorText}>{errors.identifier}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={[
                styles.input,
                errors.password &&
                  (touched.password || errors.password) &&
                  styles.inputError,
              ]}
              value={formData.password}
              onChangeText={(value) => updateFormData("password", value)}
              onBlur={() => handleBlur("password")}
              placeholder="Enter your password"
              placeholderTextColor="#94a3b8"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
            {errors.password && (touched.password || errors.password) && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              (!isFormValid() || loading) && styles.buttonDisabled,
            ]}
            onPress={handleLogin}
            disabled={!isFormValid() || loading}>
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkContainer}
            onPress={() => navigation.navigate("Signup")}
            disabled={loading}>
            <Text style={styles.linkText}>Create account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#713790",
  },
  scrollContainer: {
    flexGrow: 1,
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
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: "#1f2937",
  },
  inputError: {
    borderColor: "#ef4444",
    backgroundColor: "#fef2f2",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 14,
    marginTop: 5,
  },
  button: {
    backgroundColor: "#713790",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: "#94a3b8",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  linkContainer: {
    alignItems: "center",
  },
  linkText: {
    color: "#713790",
    fontSize: 16,
    textDecorationLine: "underline",
  },
});

export default NewLoginScreen;
