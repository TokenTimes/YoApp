// Main Screen Component - Friends List and Yo functionality
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Vibration,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import ApiService from "../services/api";
import SocketService from "../services/socket";
import ExpoNotificationService from "../services/expoNotifications";
import SoundService from "../services/sound";
import { StorageService } from "../utils/storage";

const MainScreen = ({ user, onLogout }) => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [yoNotification, setYoNotification] = useState(null);
  const [sendingYos, setSendingYos] = useState(new Set());

  const notificationOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    initializeMainScreen();
    setupSocketListeners();
    setupNotificationListeners();

    return () => {
      SocketService.removeAllListeners();
    };
  }, []);

  const initializeMainScreen = async () => {
    try {
      await SoundService.initializeSound();
      await loadFriends();

      // Connect to socket
      SocketService.connect(user.username);
    } catch (error) {
      console.error("Error initializing main screen:", error);
      Alert.alert("Error", "Failed to initialize. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    // Listen for received Yos
    SocketService.onYoReceived((data) => {
      console.log("📨 Socket event 'yoReceived' triggered! Data:", data);
      handleYoReceived(data);
    });

    // Listen for Yo sent confirmation
    SocketService.onYoSent((data) => {
      console.log("Yo sent confirmation:", data);
      if (data.success) {
        setSendingYos((prev) => {
          const newSet = new Set(prev);
          newSet.delete(data.to);
          return newSet;
        });
        showNotification(`Yo sent to ${data.to}!`, "success");
      } else {
        setSendingYos((prev) => {
          const newSet = new Set(prev);
          newSet.delete(data.to);
          return newSet;
        });
        Alert.alert("Error", "Failed to send Yo. Please try again.");
      }
    });

    // Listen for user online/offline status
    SocketService.onUserOnline((username) => {
      updateUserStatus(username, true);
    });

    SocketService.onUserOffline((username) => {
      updateUserStatus(username, false);
    });
  };

  const setupNotificationListeners = () => {
    // Set up the callback for when notifications are received
    ExpoNotificationService.setNotificationReceivedCallback(handleYoReceived);
  };

  const handleYoReceived = async (data) => {
    try {
      console.log("🎯 YO RECEIVED! From:", data.from, "Data:", data);

      // Play sound and vibration (always play sound when receiving Yo)
      console.log("🔊 About to play Yo sound...");
      await SoundService.playYoSound();
      console.log("✅ Yo sound playback completed");

      // Show in-app toast notification (only if app is in foreground)
      if (!data.fromTap) {
        console.log("💬 Showing in-app toast notification...");
        showNotification(`${data.from} sent you a Yo!`, "yo");
      }

      // If this came from a push notification tap, don't show local notification
      // (since the user already saw the push notification)
      if (!data.fromTap) {
        console.log("📱 Showing local notification...");
        await ExpoNotificationService.showYoNotification(data.from);
      }

      // Refresh friends list to update counters
      console.log("🔄 Refreshing friends list...");
      await loadFriends();

      console.log("✅ Yo received handling completed successfully");
    } catch (error) {
      console.error("❌ Error handling received Yo:", error);
    }
  };

  const loadFriends = async () => {
    try {
      const users = await ApiService.getAllUsers();
      // Filter out current user
      const friendsList = users.filter((u) => u.username !== user.username);
      setFriends(friendsList);
    } catch (error) {
      console.error("Error loading friends:", error);
      Alert.alert("Error", "Failed to load friends. Please try again.");
    }
  };

  const updateUserStatus = (username, isOnline) => {
    setFriends((prev) =>
      prev.map((friend) =>
        friend.username === username ? { ...friend, isOnline } : friend
      )
    );
  };

  const handleSendYo = async (toUsername) => {
    if (sendingYos.has(toUsername)) {
      return; // Prevent double sending
    }

    setSendingYos((prev) => new Set(prev).add(toUsername));

    try {
      // Check if socket is connected
      if (!SocketService.isConnected) {
        throw new Error(
          "Not connected to server. Please check your internet connection."
        );
      }

      console.log(`📤 SENDING YO from ${user.username} to ${toUsername}`);
      SocketService.sendYo(user.username, toUsername);
      console.log(`✅ Yo send request completed`);

      // Give subtle vibration feedback to sender (no sound)
      Vibration.vibrate(50); // Quick 50ms vibration for sender feedback

      // Set a timeout to remove loading state if no confirmation comes back
      setTimeout(() => {
        setSendingYos((prev) => {
          const newSet = new Set(prev);
          if (newSet.has(toUsername)) {
            newSet.delete(toUsername);
            console.log(`Timeout: Removing ${toUsername} from sending state`);
            Alert.alert(
              "Timeout",
              "Yo sending timed out. It may have been sent successfully."
            );
          }
          return newSet;
        });
      }, 10000); // 10 second timeout
    } catch (error) {
      console.error("Error sending Yo:", error);
      setSendingYos((prev) => {
        const newSet = new Set(prev);
        newSet.delete(toUsername);
        return newSet;
      });
      Alert.alert(
        "Error",
        error.message || "Failed to send Yo. Please try again."
      );
    }
  };

  const showNotification = (message, type = "info") => {
    setYoNotification({ message, type });

    // Animate in
    Animated.timing(notificationOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Auto hide after 3 seconds
    setTimeout(() => {
      Animated.timing(notificationOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setYoNotification(null);
      });
    }, 3000);
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            SocketService.disconnect();
            await SoundService.cleanup();
            await StorageService.clearAll();
            onLogout();
          } catch (error) {
            console.error("Error during logout:", error);
          }
        },
      },
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFriends();
    setRefreshing(false);
  };

  const renderFriendItem = ({ item }) => (
    <View style={styles.friendItem}>
      <View style={styles.friendInfo}>
        <View style={styles.friendHeader}>
          <Text style={styles.friendName}>{item.username}</Text>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: item.isOnline ? "#10b981" : "#6b7280" },
            ]}
          />
        </View>
        <Text style={styles.yoCount}>
          {item.totalYosReceived} Yo{item.totalYosReceived !== 1 ? "s" : ""}{" "}
          received
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.yoButton,
          sendingYos.has(item.username) && styles.yoButtonSending,
        ]}
        onPress={() => handleSendYo(item.username)}
        disabled={sendingYos.has(item.username)}
      >
        {sendingYos.has(item.username) ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.yoButtonText}>Yo!</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading friends...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#6366f1" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.usernameText}>{user.username}!</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            onPress={async () => {
              console.log("🧪 MANUAL SOUND TEST");
              try {
                await SoundService.playYoSound();
                Alert.alert(
                  "Sound Test",
                  "Sound test completed! Check console for details."
                );
              } catch (error) {
                console.error("Sound test failed:", error);
                Alert.alert(
                  "Sound Test",
                  `Sound test failed: ${error.message}`
                );
              }
            }}
            style={styles.testButton}
          >
            <Ionicons name="volume-high-outline" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Notification */}
      {yoNotification && (
        <Animated.View
          style={[
            styles.notification,
            {
              opacity: notificationOpacity,
              backgroundColor:
                yoNotification.type === "yo"
                  ? "#10b981"
                  : yoNotification.type === "success"
                  ? "#059669"
                  : "#6366f1",
            },
          ]}
        >
          <Text style={styles.notificationText}>{yoNotification.message}</Text>
        </Animated.View>
      )}

      {/* Friends List */}
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Friends ({friends.length})</Text>

        {friends.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#94a3b8" />
            <Text style={styles.emptyText}>No friends yet</Text>
            <Text style={styles.emptySubtext}>
              Ask your friends to sign up and start sending Yos!
            </Text>
          </View>
        ) : (
          <FlatList
            data={friends}
            keyExtractor={(item) => item.username}
            renderItem={renderFriendItem}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#64748b",
  },
  header: {
    backgroundColor: "#6366f1",
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  welcomeText: {
    color: "#e2e8f0",
    fontSize: 16,
  },
  usernameText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  testButton: {
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 8,
  },
  logoutButton: {
    padding: 8,
  },
  notification: {
    margin: 20,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  notificationText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 15,
  },
  listContainer: {
    paddingBottom: 20,
  },
  friendItem: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  friendInfo: {
    flex: 1,
  },
  friendHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  friendName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginRight: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  yoCount: {
    fontSize: 14,
    color: "#64748b",
  },
  yoButton: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 60,
    alignItems: "center",
  },
  yoButtonSending: {
    backgroundColor: "#94a3b8",
  },
  yoButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#374151",
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 24,
  },
});

export default MainScreen;
