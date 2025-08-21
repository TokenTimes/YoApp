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

const SignupScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);

  const { signup } = useAuth();

  // Validation functions
  const validateUsername = (username) => {
    if (!username) return "Username is required";
    if (username.length < 3) return "Username must be at least 3 characters";
    if (username.length > 20) return "Username must be less than 20 characters";
    if (!/^[a-zA-Z0-9_]+$/.test(username))
      return "Username can only contain letters, numbers, and underscores";
    return null;
  };

  const validateEmail = (email) => {
    if (!email) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return "Please enter a valid email address";
    return null;
  };

  const validatePassword = (password) => {
    if (!password) return "Password is required";
    if (password.length < 8) return "Password must be at least 8 characters";
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
      case "username":
        error = validateUsername(formData.username);
        break;
      case "email":
        error = validateEmail(formData.email);
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
    const usernameError = validateUsername(formData.username);
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);

    return !usernameError && !emailError && !passwordError;
  };

  // Map server error codes to user-friendly messages
  const getErrorMessage = (errorCode) => {
    const errorMessages = {
      username_taken: "That username is taken.",
      email_taken: "That email is already registered.",
      invalid_username:
        "Username can only contain letters, numbers, and underscores.",
      invalid_email: "Please enter a valid email address.",
      invalid_password: "Password must be at least 8 characters.",
      missing_fields: "Please fill in all fields.",
      server_error: "Something went wrong. Please try again.",
    };

    return errorMessages[errorCode] || "An unexpected error occurred.";
  };

  const handleSignup = async () => {
    // Validate all fields
    const usernameError = validateUsername(formData.username);
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);

    const newErrors = {};
    if (usernameError) newErrors.username = usernameError;
    if (emailError) newErrors.email = emailError;
    if (passwordError) newErrors.password = passwordError;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched({ username: true, email: true, password: true });
      return;
    }

    setLoading(true);

    try {
      await signup(formData.username, formData.email, formData.password);
      // Navigation will be handled by App.js based on auth state
    } catch (error) {
      console.error("Signup error:", error);
      const errorMessage = getErrorMessage(error.message);

      // Show specific field errors if possible
      if (error.message === "username_taken") {
        setErrors({ username: errorMessage });
      } else if (error.message === "email_taken") {
        setErrors({ email: errorMessage });
      } else {
        // Show general error
        Alert.alert("Signup Failed", errorMessage);
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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Join Yo and start sending instant notifications to your friends
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={[
                styles.input,
                errors.username && touched.username && styles.inputError,
              ]}
              value={formData.username}
              onChangeText={(value) => updateFormData("username", value)}
              onBlur={() => handleBlur("username")}
              placeholder="Enter your username"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
              editable={!loading}
            />
            {errors.username && touched.username && (
              <Text style={styles.errorText}>{errors.username}</Text>
            )}
            {!errors.username && touched.username && (
              <Text style={styles.helperText}>
                3-20 characters, letters/numbers/underscore only
              </Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[
                styles.input,
                errors.email && touched.email && styles.inputError,
              ]}
              value={formData.email}
              onChangeText={(value) => updateFormData("email", value)}
              onBlur={() => handleBlur("email")}
              placeholder="Enter your email"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
            {errors.email && touched.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={[
                styles.input,
                errors.password && touched.password && styles.inputError,
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
            {errors.password && touched.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}
            {!errors.password && touched.password && (
              <Text style={styles.helperText}>At least 8 characters</Text>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              (!isFormValid() || loading) && styles.buttonDisabled,
            ]}
            onPress={handleSignup}
            disabled={!isFormValid() || loading}>
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkContainer}
            onPress={() => navigation.navigate("Login")}
            disabled={loading}>
            <Text style={styles.linkText}>
              Already registered? Click here to login
            </Text>
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
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#e2e8f0",
    textAlign: "center",
    lineHeight: 22,
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
  helperText: {
    color: "#64748b",
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

export default SignupScreen;
