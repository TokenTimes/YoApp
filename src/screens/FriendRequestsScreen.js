// Friend Requests Screen - Manage incoming and outgoing friend requests
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import ApiService from "../services/api";

const FriendRequestsScreen = ({ user, onBack, onRequestsChanged }) => {
  const [friendRequests, setFriendRequests] = useState({
    received: [],
    sent: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingRequests, setProcessingRequests] = useState(new Set());
  const [activeTab, setActiveTab] = useState("received"); // "received" or "sent"

  useEffect(() => {
    loadFriendRequests();
  }, []);

  const loadFriendRequests = async () => {
    try {
      const requests = await ApiService.getFriendRequests(user.username);
      setFriendRequests(requests);
    } catch (error) {
      console.error("Error loading friend requests:", error);
      Alert.alert("Error", "Failed to load friend requests. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadFriendRequests();
  };

  const handleAcceptRequest = async (fromUser) => {
    if (processingRequests.has(fromUser)) return;

    setProcessingRequests((prev) => new Set(prev).add(fromUser));

    try {
      await ApiService.acceptFriendRequest(user.username, fromUser);
      Alert.alert("Success", `You are now friends with ${fromUser}!`);

      // Remove the request from the list
      setFriendRequests((prev) => ({
        ...prev,
        received: prev.received.filter((req) => req.from !== fromUser),
      }));

      // Notify parent component about the change
      if (onRequestsChanged) {
        onRequestsChanged();
      }
    } catch (error) {
      console.error("Accept request error:", error);
      Alert.alert("Error", error.message || "Failed to accept friend request");
    } finally {
      setProcessingRequests((prev) => {
        const newSet = new Set(prev);
        newSet.delete(fromUser);
        return newSet;
      });
    }
  };

  const handleRejectRequest = async (fromUser) => {
    if (processingRequests.has(fromUser)) return;

    Alert.alert(
      "Reject Friend Request",
      `Are you sure you want to reject ${fromUser}'s friend request?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            setProcessingRequests((prev) => new Set(prev).add(fromUser));

            try {
              await ApiService.rejectFriendRequest(user.username, fromUser);

              // Remove the request from the list
              setFriendRequests((prev) => ({
                ...prev,
                received: prev.received.filter((req) => req.from !== fromUser),
              }));

              // Notify parent component about the change
              if (onRequestsChanged) {
                onRequestsChanged();
              }
            } catch (error) {
              console.error("Reject request error:", error);
              Alert.alert(
                "Error",
                error.message || "Failed to reject friend request"
              );
            } finally {
              setProcessingRequests((prev) => {
                const newSet = new Set(prev);
                newSet.delete(fromUser);
                return newSet;
              });
            }
          },
        },
      ]
    );
  };

  const renderReceivedRequestItem = ({ item }) => (
    <View style={styles.requestItem}>
      <View style={styles.requestInfo}>
        <Text style={styles.username}>{item.from}</Text>
        <Text style={styles.timestamp}>
          {new Date(item.timestamp).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.acceptButton]}
          onPress={() => handleAcceptRequest(item.from)}
          disabled={processingRequests.has(item.from)}>
          {processingRequests.has(item.from) ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="checkmark" size={16} color="white" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleRejectRequest(item.from)}
          disabled={processingRequests.has(item.from)}>
          <Ionicons name="close" size={16} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSentRequestItem = ({ item }) => (
    <View style={styles.requestItem}>
      <View style={styles.requestInfo}>
        <Text style={styles.username}>{item.to}</Text>
        <Text style={styles.timestamp}>
          Sent {new Date(item.timestamp).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.pendingIndicator}>
        <Text style={styles.pendingText}>Pending</Text>
      </View>
    </View>
  );

  const renderEmptyState = () => {
    const isReceived = activeTab === "received";
    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name={isReceived ? "person-add-outline" : "time-outline"}
          size={48}
          color="#6b7280"
        />
        <Text style={styles.emptyText}>
          {isReceived ? "No friend requests" : "No pending requests"}
        </Text>
        <Text style={styles.emptySubtext}>
          {isReceived
            ? "You don't have any pending friend requests"
            : "You haven't sent any friend requests"}
        </Text>
      </View>
    );
  };

  const getCurrentData = () => {
    return activeTab === "received"
      ? friendRequests.received
      : friendRequests.sent;
  };

  const getCurrentCount = () => {
    return getCurrentData().length;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" backgroundColor="#1f2937" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading friend requests...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#1f2937" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Friend Requests</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "received" && styles.activeTab]}
          onPress={() => setActiveTab("received")}>
          <Text
            style={[
              styles.tabText,
              activeTab === "received" && styles.activeTabText,
            ]}>
            Received ({friendRequests.received.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "sent" && styles.activeTab]}
          onPress={() => setActiveTab("sent")}>
          <Text
            style={[
              styles.tabText,
              activeTab === "sent" && styles.activeTabText,
            ]}>
            Sent ({friendRequests.sent.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        {getCurrentCount() > 0 ? (
          <FlatList
            data={getCurrentData()}
            renderItem={
              activeTab === "received"
                ? renderReceivedRequestItem
                : renderSentRequestItem
            }
            keyExtractor={(item) =>
              activeTab === "received" ? item.from : item.to
            }
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#6366f1"
                colors={["#6366f1"]}
              />
            }
          />
        ) : (
          renderEmptyState()
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111827",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#9ca3af",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#1f2937",
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#1f2937",
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#6366f1",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#9ca3af",
  },
  activeTabText: {
    color: "#6366f1",
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  requestItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1f2937",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#374151",
  },
  requestInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: "#9ca3af",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  acceptButton: {
    backgroundColor: "#10b981",
  },
  rejectButton: {
    backgroundColor: "#ef4444",
  },
  pendingIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#f59e0b",
    borderRadius: 12,
  },
  pendingText: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#9ca3af",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
});

export default FriendRequestsScreen;
