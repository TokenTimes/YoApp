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
  TextInput,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import ApiService from "../services/api";
import SocketService from "../services/socket";
import PushNotificationService from "../services/pushNotifications";
import SoundService from "../services/sound";
import { StorageService } from "../utils/storage";
import FriendSearchScreen from "./FriendSearchScreen";
import UserSearchScreen from "./UserSearchScreen";
import SwipeableRow from "../components/SwipeableRow";

const MainScreen = ({ user, onLogout }) => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [yoNotification, setYoNotification] = useState(null);
  const [sendingYos, setSendingYos] = useState(new Set());
  const [currentScreen, setCurrentScreen] = useState("friends"); // "friends", "search"
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredFriends, setFilteredFriends] = useState([]);

  const notificationOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    initializeMainScreen();
    setupSocketListeners();
    setupNotificationListeners();

    return () => {
      SocketService.removeAllListeners();
    };
  }, []);

  // Filter friends based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredFriends(friends);
    } else {
      const filtered = friends.filter((friend) =>
        friend.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredFriends(filtered);
    }
  }, [friends, searchQuery]);

  const initializeMainScreen = async () => {
    try {
      await SoundService.initializeSound();
      await loadFriends();

      // Always ensure we have a fresh push token
      let expoPushToken = await StorageService.getExpoPushToken();

      // If no token in storage, generate a new one
      if (!expoPushToken) {
        console.log("🔔 No push token found, generating new one...");
        expoPushToken = await PushNotificationService.initialize();
        if (expoPushToken) {
          await StorageService.saveExpoPushToken(expoPushToken);
          console.log(
            "✅ Push token generated and saved:",
            expoPushToken.substring(0, 20) + "..."
          );
        }
      } else {
        console.log(
          "✅ Using existing push token:",
          expoPushToken.substring(0, 20) + "..."
        );
      }

      // Set up push notification callback
      if (expoPushToken) {
        PushNotificationService.setNotificationCallback((notification) => {
          console.log("🔔 Received notification:", notification);
          if (notification.from) {
            SoundService.playYoSound();
          }
        });
      }

      // Connect to socket with push token
      SocketService.connect(user.username, expoPushToken);

      // Also update push token via API as backup
      if (expoPushToken) {
        try {
          await ApiService.loginUser(user.username, expoPushToken);
          console.log("✅ Push token updated via API as backup");
        } catch (error) {
          console.log("⚠️ Failed to update push token via API:", error.message);
        }
      }
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

    // Listen for when someone adds you as a friend (instant add)
    SocketService.onFriendAdded((data) => {
      showNotification(`${data.from} added you as a friend!`, "success");
      // Refresh friends list to show the new friend
      loadFriends();
    });
  };

  const setupNotificationListeners = () => {
    // Set up the callback for when notifications are received
    // Notification callback is now set in initializeMainScreen
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
        await PushNotificationService.scheduleLocalNotification(data.from);
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
      // Load only friends instead of all users
      const friendsList = await ApiService.getFriends(user.username);
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

      // Remove from sending state immediately after sending
      setTimeout(() => {
        setSendingYos((prev) => {
          const newSet = new Set(prev);
          newSet.delete(toUsername);
          return newSet;
        });
      }, 1000); // Quick 1 second to show sending animation
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

  const handleRemoveFriend = async (friendUsername) => {
    try {
      await ApiService.removeFriend(user.username, friendUsername);

      // Remove from local state immediately for instant feedback
      setFriends((prevFriends) =>
        prevFriends.filter((friend) => friend.username !== friendUsername)
      );

      // Show feedback
      showNotification(`${friendUsername} removed from friends`, "success");

      // Vibration feedback
      Vibration.vibrate(50);
    } catch (error) {
      console.error("Error removing friend:", error);
      Alert.alert("Error", "Failed to remove friend. Please try again.");
      // Reload friends list to restore state
      loadFriends();
    }
  };

  const handleBlockUser = async (friendUsername) => {
    Alert.alert(
      "Block User",
      `Are you sure you want to block ${friendUsername}? This will remove them from your friends and prevent further communication.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Block",
          style: "destructive",
          onPress: async () => {
            try {
              await ApiService.blockUser(user.username, friendUsername);

              // Remove from local state immediately for instant feedback
              setFriends((prevFriends) =>
                prevFriends.filter(
                  (friend) => friend.username !== friendUsername
                )
              );

              showNotification(`${friendUsername} has been blocked`, "success");
            } catch (error) {
              console.error("Error blocking user:", error);
              Alert.alert("Error", "Failed to block user. Please try again.");

              // Reload friends list to restore state
              loadFriends();
            }
          },
        },
      ]
    );
  };

  const handleLongPress = (friendUsername) => {
    Vibration.vibrate(30);
    Alert.alert(
      "Remove Friend",
      `Are you sure you want to remove ${friendUsername} from your friends?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => handleRemoveFriend(friendUsername),
        },
      ]
    );
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
    <SwipeableRow
      item={item}
      onRemove={handleRemoveFriend}
      onBlock={handleBlockUser}>
      <TouchableOpacity
        style={styles.friendItem}
        onLongPress={() => handleLongPress(item.username)}
        delayLongPress={500}
        activeOpacity={0.95}>
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
          <Text style={styles.helpText}>
            Long press to remove • Swipe left for options
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.yoButton,
            sendingYos.has(item.username) && styles.yoButtonSending,
          ]}
          onPress={() => handleSendYo(item.username)}
          disabled={sendingYos.has(item.username)}>
          {sendingYos.has(item.username) ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.yoButtonText}>Yo!</Text>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </SwipeableRow>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#713790" />
        <Text style={styles.loadingText}>Loading friends...</Text>
      </View>
    );
  }

  // Handle screen navigation
  if (currentScreen === "search") {
    return (
      <UserSearchScreen
        user={user}
        onBack={() => {
          setCurrentScreen("friends");
          // Refresh friends list when coming back from search
          loadFriends();
        }}
        onUserAdded={(addedUsername) => {
          // Refresh friends list immediately when a user is added
          loadFriends();
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#713790" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.usernameText}>{user.username}!</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            onPress={() => setCurrentScreen("search")}
            style={styles.iconButton}>
            <Ionicons name="add" size={22} color="#fff" />
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
                  : "#713790",
            },
          ]}>
          <Text style={styles.notificationText}>{yoNotification.message}</Text>
        </Animated.View>
      )}

      {/* Search Bar */}
      {friends.length > 0 && (
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons
              name="search"
              size={20}
              color="#64748b"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search friends..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Friends List */}
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>
          {searchQuery
            ? `Found ${filteredFriends.length} friend${
                filteredFriends.length !== 1 ? "s" : ""
              }`
            : `Friends (${friends.length})`}
        </Text>

        {friends.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#94a3b8" />
            <Text style={styles.emptyText}>No friends yet</Text>
            <Text style={styles.emptySubtext}>
              Tap the + button to find and add friends instantly!
            </Text>
          </View>
        ) : filteredFriends.length === 0 && searchQuery ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={64} color="#94a3b8" />
            <Text style={styles.emptyText}>No friends found</Text>
            <Text style={styles.emptySubtext}>
              Try searching with a different name
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredFriends}
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
    backgroundColor: "#713790",
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
  iconButton: {
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 8,
    position: "relative",
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
  searchContainer: {
    backgroundColor: "#f8fafc",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1f2937",
  },
  clearButton: {
    padding: 4,
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
  helpText: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
    fontStyle: "italic",
  },
  yoButton: {
    backgroundColor: "#713790",
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
