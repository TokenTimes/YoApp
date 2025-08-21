// User Search Screen - Simple search and instant add functionality
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
  Vibration,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import ApiService from "../services/api";

const UserSearchScreen = ({ user, onBack, onUserAdded }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addingUsers, setAddingUsers] = useState(new Set());

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const results = await ApiService.searchUsersSimple(
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

  const handleAddUser = async (toUser) => {
    if (addingUsers.has(toUser)) return;

    setAddingUsers((prev) => new Set(prev).add(toUser));

    try {
      const result = await ApiService.addUserInstant(user.username, toUser);

      // Provide immediate feedback
      Vibration.vibrate(50); // Quick haptic feedback

      // Update the search results to reflect the new friend status
      setSearchResults((prev) =>
        prev.map((result) =>
          result.username === toUser ? { ...result, isFriend: true } : result
        )
      );

      // Show success message
      Alert.alert(
        "Success!",
        `${toUser} has been added to your friends! You can now send them Yo messages.`,
        [{ text: "OK", style: "default" }]
      );

      // Notify parent component about the added user
      if (onUserAdded) {
        onUserAdded(toUser);
      }
    } catch (error) {
      console.error("Add user error:", error);
      Alert.alert("Error", error.message || "Failed to add user");
    } finally {
      setAddingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(toUser);
        return newSet;
      });
    }
  };

  const renderUserItem = ({ item }) => (
    <View style={styles.userItem}>
      <View style={styles.userInfo}>
        <View style={styles.userHeader}>
          <Text style={styles.username}>{item.username}</Text>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: item.isOnline ? "#10b981" : "#6b7280" },
            ]}
          />
        </View>
        <Text style={styles.userStats}>
          {item.totalYosReceived} Yo{item.totalYosReceived !== 1 ? "s" : ""}{" "}
          received
        </Text>
        <Text style={styles.lastSeen}>
          {item.isOnline
            ? "Online now"
            : `Last seen ${new Date(item.lastSeen).toLocaleDateString()}`}
        </Text>
      </View>

      {item.isFriend ? (
        <View style={[styles.addButton, styles.alreadyFriendButton]}>
          <Ionicons name="checkmark-circle" size={16} color="#10b981" />
          <Text style={styles.alreadyFriendText}>Friends</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[
            styles.addButton,
            addingUsers.has(item.username) && styles.addButtonLoading,
          ]}
          onPress={() => handleAddUser(item.username)}
          disabled={addingUsers.has(item.username)}>
          {addingUsers.has(item.username) ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="person-add" size={16} color="#fff" />
              <Text style={styles.addButtonText}>Add</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  // Real-time search as user types (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 300); // 300ms debounce for responsive search

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="#713790" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
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
            color="#64748b"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by username..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus={true}
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

      {/* Search Results */}
      <View style={styles.resultsContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#713790" />
            <Text style={styles.loadingText}>Searching users...</Text>
          </View>
        ) : searchResults.length > 0 ? (
          <>
            <Text style={styles.resultsHeader}>
              {searchResults.length} user{searchResults.length !== 1 ? "s" : ""}{" "}
              found
            </Text>
            <FlatList
              data={searchResults}
              renderItem={renderUserItem}
              keyExtractor={(item) => item.username}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />
          </>
        ) : searchQuery.trim() ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={64} color="#94a3b8" />
            <Text style={styles.emptyText}>No users found</Text>
            <Text style={styles.emptySubtext}>
              Try searching with a different username
            </Text>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#94a3b8" />
            <Text style={styles.emptyText}>Search for users</Text>
            <Text style={styles.emptySubtext}>
              Enter a username to find and add friends instantly
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
    backgroundColor: "#f8fafc",
  },
  header: {
    backgroundColor: "#713790",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  searchContainer: {
    backgroundColor: "#713790",
    paddingHorizontal: 20,
    paddingBottom: 20,
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
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
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
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  resultsHeader: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#64748b",
  },
  userItem: {
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
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  username: {
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
  userStats: {
    fontSize: 13,
    color: "#713790",
    fontWeight: "500",
    marginBottom: 2,
  },
  lastSeen: {
    fontSize: 12,
    color: "#94a3b8",
  },
  addButton: {
    backgroundColor: "#713790",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 80,
    justifyContent: "center",
  },
  addButtonLoading: {
    backgroundColor: "#94a3b8",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  alreadyFriendButton: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  alreadyFriendText: {
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

export default UserSearchScreen;
