// API service for communicating with the backend
import { API_BASE_URL } from "../config/network";

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === "object") {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      return data;
    } catch (error) {
      console.error("API Request Error:", error);
      throw error;
    }
  }

  // User authentication
  async loginUser(username, expoPushToken = null) {
    return this.request("/users/login", {
      method: "POST",
      body: { username, expoPushToken },
    });
  }

  // Get all users
  async getAllUsers() {
    return this.request("/users");
  }

  // Get user by username
  async getUser(username) {
    return this.request(`/users/${username}`);
  }

  // Get user's Yos
  async getUserYos(username) {
    return this.request(`/users/${username}/yos`);
  }

  // Health check
  async healthCheck() {
    return this.request("/health");
  }

  // ==================
  // FRIENDS MANAGEMENT
  // ==================

  // Search users by username
  async searchUsers(username, searchQuery) {
    return this.request("/friends/search", {
      method: "POST",
      body: { username, searchQuery },
    });
  }

  // Send friend request
  async sendFriendRequest(fromUser, toUser) {
    return this.request("/friends/request", {
      method: "POST",
      body: { fromUser, toUser },
    });
  }

  // Accept friend request
  async acceptFriendRequest(username, fromUser) {
    return this.request("/friends/accept", {
      method: "POST",
      body: { username, fromUser },
    });
  }

  // Reject friend request
  async rejectFriendRequest(username, fromUser) {
    return this.request("/friends/reject", {
      method: "POST",
      body: { username, fromUser },
    });
  }

  // Remove friend
  async removeFriend(username, friendUsername) {
    return this.request(`/friends/${friendUsername}`, {
      method: "DELETE",
      body: { username },
    });
  }

  // Get user's friends list
  async getFriends(username) {
    return this.request(`/friends/${username}`);
  }

  // Get friend requests
  async getFriendRequests(username) {
    return this.request(`/friends/requests/${username}`);
  }

  // ========================
  // SIMPLIFIED USER SEARCH AND ADD
  // ========================

  // Simple user search (case-insensitive partial matching)
  async searchUsersSimple(username, searchQuery) {
    return this.request("/users/search", {
      method: "POST",
      body: { username, searchQuery },
    });
  }

  // Instant add user as friend (no requests, instant addition)
  async addUserInstant(fromUser, toUser) {
    return this.request("/users/add", {
      method: "POST",
      body: { fromUser, toUser },
    });
  }
}

export default new ApiService();
