// API service for communicating with the backend
import { API_BASE_URL } from "../config/network";

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.authToken = null;
    this.refreshTokenPromise = null;
    this.refreshCallback = null;
  }

  setAuthToken(token) {
    this.authToken = token;
  }

  clearAuthToken() {
    this.authToken = null;
  }

  setRefreshCallback(callback) {
    this.refreshCallback = callback;
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

    // Add auth token if available
    if (this.authToken) {
      config.headers.Authorization = `Bearer ${this.authToken}`;
    }

    if (config.body && typeof config.body === "object") {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Handle 401 errors (token expired) for authenticated requests
        if (
          response.status === 401 &&
          this.authToken &&
          !endpoint.includes("/auth/")
        ) {
          // Try to refresh token once
          if (this.refreshCallback && !this.refreshTokenPromise) {
            this.refreshTokenPromise = this.refreshCallback();
            try {
              await this.refreshTokenPromise;
              this.refreshTokenPromise = null;

              // Retry the original request with new token
              const retryConfig = {
                ...config,
                headers: {
                  ...config.headers,
                  Authorization: `Bearer ${this.authToken}`,
                },
              };

              const retryResponse = await fetch(url, retryConfig);
              const retryData = await retryResponse.json();

              if (!retryResponse.ok) {
                throw new Error(retryData.error || "Something went wrong");
              }

              return retryData;
            } catch (refreshError) {
              this.refreshTokenPromise = null;
              throw new Error("token_expired");
            }
          }
          throw new Error("token_expired");
        }
        throw new Error(data.error || "Something went wrong");
      }

      return data;
    } catch (error) {
      console.error("API Request Error:", error);
      throw error;
    }
  }

  // =====================
  // NEW AUTH ENDPOINTS
  // =====================

  // User signup
  async signup(username, email, password) {
    return this.request("/auth/signup", {
      method: "POST",
      body: { username, email, password },
    });
  }

  // User login
  async login(identifier, password) {
    return this.request("/auth/login", {
      method: "POST",
      body: { identifier, password },
    });
  }

  // Refresh access token
  async refreshToken(refreshToken) {
    return this.request("/auth/refresh", {
      method: "POST",
      body: { refreshToken },
    });
  }

  // =====================
  // LEGACY AUTH (keep for backward compatibility)
  // =====================

  // User authentication (legacy)
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

  // ========================
  // USER BLOCKING SYSTEM
  // ========================

  // Block user
  async blockUser(username, userToBlock) {
    return this.request("/users/block", {
      method: "POST",
      body: { username, userToBlock },
    });
  }

  // Unblock user
  async unblockUser(username, userToUnblock) {
    return this.request("/users/unblock", {
      method: "POST",
      body: { username, userToUnblock },
    });
  }
}

export default new ApiService();
