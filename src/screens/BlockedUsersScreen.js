// Blocked Users Management Screen
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import ApiService from "../services/api";

const BlockedUsersScreen = ({ user, onBack }) => {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadBlockedUsers();
  }, []);

  const loadBlockedUsers = async () => {
    try {
      setLoading(true);
      const blockedList = await ApiService.getBlockedUsers(user.username);
      setBlockedUsers(blockedList);
    } catch (error) {
      console.error("Error loading blocked users:", error);
      Alert.alert("Error", "Failed to load blocked users");
    } finally {
      setLoading(false);
    }
  };

  const handleUnblockUser = async (blockedUsername) => {
    Alert.alert(
      "Unblock User",
      `Are you sure you want to unblock ${blockedUsername}? They will be able to send you Yos again.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Unblock",
          style: "default",
          onPress: async () => {
            try {
              await ApiService.unblockUser(user.username, blockedUsername);

              // Remove from local state immediately for instant feedback
              setBlockedUsers((prevBlocked) =>
                prevBlocked.filter(
                  (blocked) => blocked.username !== blockedUsername
                )
              );

              Alert.alert("Success", `${blockedUsername} has been unblocked`);
            } catch (error) {
              console.error("Error unblocking user:", error);
              Alert.alert("Error", "Failed to unblock user. Please try again.");

              // Reload blocked users list to restore state
              loadBlockedUsers();
            }
          },
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBlockedUsers();
    setRefreshing(false);
  };

  const getRandomColor = (username) => {
    const colors = [
      "#6b7280", // gray (darker for blocked users)
      "#71717a", // zinc
      "#737373", // neutral
      "#78716c", // stone
    ];

    // Generate consistent color based on username
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const renderBlockedUserItem = ({ item }) => (
    <View style={styles.blockedUserContainer}>
      <View
        style={[
          styles.blockedUserItem,
          { backgroundColor: getRandomColor(item.username) },
        ]}>
        <View style={styles.userInfo}>
          <Text style={styles.username}>{item.username}</Text>
          <View style={styles.userStats}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: item.isOnline
                    ? "rgba(255,255,255,0.8)"
                    : "rgba(255,255,255,0.4)",
                },
              ]}
            />
            <Text style={styles.statusText}>
              {item.isOnline ? "Online" : "Offline"}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.unblockButton}
          onPress={() => handleUnblockUser(item.username)}
          activeOpacity={0.7}>
          <Ionicons name="checkmark-circle-outline" size={24} color="#10b981" />
          <Text style={styles.unblockText}>Unblock</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" backgroundColor="#713790" />
        <ActivityIndicator size="large" color="#713790" />
        <Text style={styles.loadingText}>Loading blocked users...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#713790" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Blocked Users</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {blockedUsers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="ban-outline" size={64} color="#9ca3af" />
            <Text style={styles.emptyTitle}>No Blocked Users</Text>
            <Text style={styles.emptySubtitle}>
              Users you block will appear here. You can unblock them anytime.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>
              {blockedUsers.length} Blocked User
              {blockedUsers.length !== 1 ? "s" : ""}
            </Text>
            <FlatList
              data={blockedUsers}
              renderItem={renderBlockedUserItem}
              keyExtractor={(item) => item.username}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={["#713790"]}
                  tintColor="#713790"
                />
              }
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />
          </>
        )}
      </View>
    </View>
  );
};

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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 60,
    backgroundColor: "#713790",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    flex: 1,
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginHorizontal: 20,
  },
  headerSpacer: {
    width: 34,
  },
  content: {
    flex: 1,
    backgroundColor: "#f8fafc",
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  blockedUserContainer: {
    marginBottom: 12,
  },
  blockedUserItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  userStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "500",
  },
  unblockButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  unblockText: {
    color: "#10b981",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 24,
  },
});

export default BlockedUsersScreen;
