const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const config = require("./config");

const User = require("./models/User");
const expoPushService = require("./services/expoPushService");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(config.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Expo Push Service is initialized automatically

// Store active socket connections
const activeUsers = new Map();

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // User joins with username
  socket.on("join", async (data) => {
    try {
      console.log("🔍 DEBUG: Received join data:", data);

      // Handle both old format (string) and new format (object)
      let username, expoPushToken;
      if (typeof data === "string") {
        username = data;
        expoPushToken = null;
        console.log("🔍 DEBUG: Old format - username only:", username);
      } else {
        username = data.username;
        expoPushToken = data.expoPushToken;
        console.log(
          "🔍 DEBUG: New format - username:",
          username,
          "token:",
          expoPushToken ? "present" : "null"
        );
      }

      socket.username = username;
      activeUsers.set(username, socket.id);

      // Update user online status AND push token automatically
      const updateData = {
        isOnline: true,
        lastSeen: new Date(),
      };

      if (expoPushToken) {
        updateData.expoPushToken = expoPushToken;
        console.log("🔍 DEBUG: Will update push token for", username);
      }

      await User.findOneAndUpdate({ username }, updateData, {
        upsert: true,
        new: true,
      });

      socket.join(username);

      // Broadcast to all users that someone came online
      socket.broadcast.emit("userOnline", username);

      console.log(
        `${username} joined and is online${
          expoPushToken ? " (push token updated)" : ""
        }`
      );
    } catch (error) {
      console.error("Error in join event:", error);
    }
  });

  // Handle sending Yo
  socket.on("sendYo", async (data) => {
    try {
      const { fromUser, toUser } = data;

      // Save Yo to database
      const targetUser = await User.findOneAndUpdate(
        { username: toUser },
        {
          $push: { yosReceived: { from: fromUser, timestamp: new Date() } },
          $inc: { totalYosReceived: 1 },
        },
        { upsert: true, new: true }
      );

      // Send real-time notification to target user if they're online
      const targetSocketId = activeUsers.get(toUser);
      if (targetSocketId) {
        io.to(targetSocketId).emit("yoReceived", {
          from: fromUser,
          timestamp: new Date(),
          totalYos: targetUser.totalYosReceived,
        });
      }

      // Send Expo push notification if user has push token
      let pushNotificationSent = false;
      if (targetUser.expoPushToken) {
        try {
          const notificationResult = await expoPushService.sendYoNotification(
            targetUser.expoPushToken,
            fromUser
          );
          console.log("Expo notification result:", notificationResult);

          if (notificationResult.success) {
            pushNotificationSent = true;
          }

          // Handle DeviceNotRegistered error by removing invalid token
          if (notificationResult.shouldRemoveToken) {
            console.log(`🚫 Removing invalid push token for ${toUser}`);
            await User.findOneAndUpdate(
              { username: toUser },
              { $unset: { expoPushToken: 1 } }
            );
          }
        } catch (error) {
          console.error("Error sending Expo notification:", error);
        }
      }

      // If push notification failed or no token, try socket notification
      if (!pushNotificationSent) {
        console.log(
          `📱 Push notification failed/unavailable for ${toUser}, using socket fallback`
        );
        // The socket notification above will handle it
      }

      // Send confirmation back to sender
      socket.emit("yoSent", { to: toUser, success: true });

      console.log(`Yo sent from ${fromUser} to ${toUser}`);
    } catch (error) {
      console.error("Error sending Yo:", error);
      socket.emit("yoSent", { success: false, error: error.message });
    }
  });

  // Handle disconnect
  socket.on("disconnect", async () => {
    if (socket.username) {
      try {
        activeUsers.delete(socket.username);

        // Update user offline status
        await User.findOneAndUpdate(
          { username: socket.username },
          { isOnline: false, lastSeen: new Date() }
        );

        // Broadcast to all users that someone went offline
        socket.broadcast.emit("userOffline", socket.username);

        console.log(`${socket.username} disconnected and is offline`);
      } catch (error) {
        console.error("Error in disconnect event:", error);
      }
    }
  });
});

// REST API Routes

// Get all users
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find(
      {},
      "username isOnline totalYosReceived lastSeen"
    ).sort({ username: 1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user by username
app.get("/api/users/:username", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create or login user
app.post("/api/users/login", async (req, res) => {
  try {
    const { username, expoPushToken } = req.body;

    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    const user = await User.findOneAndUpdate(
      { username },
      {
        expoPushToken,
        isOnline: true,
        lastSeen: new Date(),
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      user: {
        username: user.username,
        totalYosReceived: user.totalYosReceived,
        isOnline: user.isOnline,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      // Username already exists, update their push token and login
      const user = await User.findOneAndUpdate(
        { username: req.body.username },
        {
          expoPushToken: req.body.expoPushToken,
          isOnline: true,
          lastSeen: new Date(),
        },
        { new: true }
      );
      res.json({
        success: true,
        user: {
          username: user.username,
          totalYosReceived: user.totalYosReceived,
          isOnline: user.isOnline,
        },
      });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Get Yos for a user
app.get("/api/users/:username/yos", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      yosReceived: user.yosReceived.slice(-50), // Last 50 Yos
      totalYosReceived: user.totalYosReceived,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to check user push tokens
app.get("/api/debug/users", async (req, res) => {
  try {
    const users = await User.find(
      {},
      "username expoPushToken isOnline lastSeen"
    ).sort({ username: 1 });

    const usersWithTokenInfo = users.map((user) => ({
      username: user.username,
      hasExpoPushToken: !!user.expoPushToken,
      expoPushToken: user.expoPushToken
        ? `${user.expoPushToken.substring(0, 20)}...`
        : null,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
    }));

    res.json(usersWithTokenInfo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test endpoint to manually set push token for debugging
app.post("/api/debug/set-token/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const { token } = req.body;

    const user = await User.findOneAndUpdate(
      { username },
      { expoPushToken: token },
      { new: true }
    );

    res.json({ success: true, user: user.username, tokenSet: !!token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date() });
});

const PORT = config.PORT;
server.listen(PORT, () => {
  console.log(`Yo App server running on port ${PORT}`);
  console.log(`Socket.IO server ready for connections`);
});
