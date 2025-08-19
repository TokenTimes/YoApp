// Socket.IO service for real-time communication
import io from "socket.io-client";
import { SOCKET_SERVER_URL } from '../config/network';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.serverURL = SOCKET_SERVER_URL;
  }

  connect(username) {
    if (this.socket) {
      this.disconnect();
    }

    this.socket = io(this.serverURL, {
      transports: ["websocket", "polling"],
    });

    this.socket.on("connect", () => {
      console.log("Connected to server");
      this.isConnected = true;
      this.socket.emit("join", username);
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from server");
      this.isConnected = false;
    });

    this.socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
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
      this.socket.emit("sendYo", { fromUser, toUser });
    } else {
      console.error("Socket not connected");
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
