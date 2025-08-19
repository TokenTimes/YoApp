// API service for communicating with the backend
import { API_BASE_URL } from '../config/network';

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
}

export default new ApiService();
