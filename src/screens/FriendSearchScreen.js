// Friend Search Screen - Search and add friends
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import ApiService from "../services/api";

const FriendSearchScreen = ({ user, onBack, onRequestSent }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendingRequests, setSendingRequests] = useState(new Set());

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const results = await ApiService.searchUsers(
        user.username,
        searchQuery.trim()
      );
      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
      Alert.alert("Error", "Failed to search users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendFriendRequest = async (toUser) => {
    if (sendingRequests.has(toUser)) return;

    setSendingRequests((prev) => new Set(prev).add(toUser));

    try {
      await ApiService.sendFriendRequest(user.username, toUser);
      Alert.alert("Success", `Friend request sent to ${toUser}!`);

      // Update the search results to reflect the sent request
      setSearchResults((prev) =>
        prev.map((result) =>
          result.username === toUser
            ? { ...result, hasReceivedRequest: true }
            : result
        )
      );

      // Notify parent component about the sent request
      if (onRequestSent) {
        onRequestSent();
      }
    } catch (error) {
      console.error("Friend request error:", error);
      Alert.alert("Error", error.message || "Failed to send friend request");
    } finally {
      setSendingRequests((prev) => {
        const newSet = new Set(prev);
        newSet.delete(toUser);
        return newSet;
      });
    }
  };

  const getButtonText = (result) => {
    if (result.isFriend) return "Friends";
    if (result.hasReceivedRequest) return "Request Sent";
    if (result.hasSentRequest) return "Accept Request";
    return "Add Friend";
  };

  const getButtonStyle = (result) => {
    if (result.isFriend) return [styles.actionButton, styles.friendsButton];
    if (result.hasReceivedRequest)
      return [styles.actionButton, styles.pendingButton];
    if (result.hasSentRequest)
      return [styles.actionButton, styles.acceptButton];
    return [styles.actionButton, styles.addButton];
  };

  const isButtonDisabled = (result) => {
    return (
      result.isFriend ||
      result.hasReceivedRequest ||
      sendingRequests.has(result.username)
    );
  };

  const renderUserItem = ({ item }) => (
    <View style={styles.userItem}>
      <View style={styles.userInfo}>
        <View style={styles.userHeader}>
          <Text style={styles.username}>{item.username}</Text>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: item.isOnline ? "#4ade80" : "#6b7280" },
            ]}
          />
        </View>
        <Text style={styles.lastSeen}>
          {item.isOnline
            ? "Online"
            : `Last seen ${new Date(item.lastSeen).toLocaleDateString()}`}
        </Text>
      </View>

      <TouchableOpacity
        style={getButtonStyle(item)}
        onPress={() => handleSendFriendRequest(item.username)}
        disabled={isButtonDisabled(item)}>
        {sendingRequests.has(item.username) ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={styles.buttonText}>{getButtonText(item)}</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#1f2937" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Friends</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#6b7280"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by username..."
            placeholderTextColor="#6b7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      {/* Search Results */}
      <View style={styles.resultsContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#713790" />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        ) : searchResults.length > 0 ? (
          <FlatList
            data={searchResults}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.username}
            showsVerticalScrollIndicator={false}
          />
        ) : searchQuery.trim() ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="person-outline" size={48} color="#6b7280" />
            <Text style={styles.emptyText}>No users found</Text>
            <Text style={styles.emptySubtext}>
              Try searching with a different username
            </Text>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color="#6b7280" />
            <Text style={styles.emptyText}>Search for friends</Text>
            <Text style={styles.emptySubtext}>
              Enter a username to find and add friends
            </Text>
          </View>
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
  searchContainer: {
    padding: 20,
    backgroundColor: "#1f2937",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#374151",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "white",
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 20,
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
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1f2937",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#374151",
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginRight: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  lastSeen: {
    fontSize: 12,
    color: "#9ca3af",
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
  },
  addButton: {
    backgroundColor: "#713790",
  },
  friendsButton: {
    backgroundColor: "#10b981",
  },
  pendingButton: {
    backgroundColor: "#f59e0b",
  },
  acceptButton: {
    backgroundColor: "#8b5cf6",
  },
  buttonText: {
    fontSize: 14,
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

export default FriendSearchScreen;
