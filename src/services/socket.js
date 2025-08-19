// Socket.IO service for real-time communication
import io from "socket.io-client";
import { SOCKET_SERVER_URL } from "../config/network";

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.serverURL = SOCKET_SERVER_URL;
  }

  connect(username, expoPushToken = null) {
    if (this.socket) {
      this.disconnect();
    }

    this.socket = io(this.serverURL, {
      transports: ["websocket", "polling"],
    });

    this.socket.on("connect", () => {
      console.log(`✅ Connected to server at ${this.serverURL}`);
      this.isConnected = true;
      // Send both username and push token to server
      this.socket.emit("join", { username, expoPushToken });
    });

    this.socket.on("disconnect", (reason) => {
      console.log(`❌ Disconnected from server: ${reason}`);
      this.isConnected = false;
    });

    this.socket.on("connect_error", (error) => {
      console.error(`🔴 Connection error:`, error.message);
      console.error(`Trying to connect to: ${this.serverURL}`);
      this.isConnected = false;
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  sendYo(fromUser, toUser) {
    if (this.socket && this.isConnected) {
      console.log(`Sending Yo from ${fromUser} to ${toUser}`);
      this.socket.emit("sendYo", { fromUser, toUser });
    } else {
      console.error("Socket not connected - cannot send Yo");
      throw new Error("Socket not connected");
    }
  }

  onYoReceived(callback) {
    if (this.socket) {
      this.socket.on("yoReceived", callback);
    }
  }

  onYoSent(callback) {
    if (this.socket) {
      this.socket.on("yoSent", callback);
    }
  }

  onUserOnline(callback) {
    if (this.socket) {
      this.socket.on("userOnline", callback);
    }
  }

  onUserOffline(callback) {
    if (this.socket) {
      this.socket.on("userOffline", callback);
    }
  }

  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }
}

export default new SocketService();
