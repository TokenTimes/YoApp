const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const config = require("./config");

const User = require("./models/User");
const expoPushService = require("./services/expoPushService");
const jwtService = require("./services/jwtService");
const authMiddleware = require("./middleware/auth");

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

      // Check if users are friends before allowing Yo
      const senderUser = await User.findOne({ username: fromUser });
      if (!senderUser) {
        socket.emit("yoSent", { success: false, error: "Sender not found" });
        return;
      }

      if (!senderUser.friends?.includes(toUser)) {
        socket.emit("yoSent", {
          success: false,
          error: "Can only send Yos to friends",
        });
        return;
      }

      // Check if the recipient has blocked the sender
      const recipientUser = await User.findOne({ username: toUser });
      if (recipientUser?.blockedUsers?.includes(fromUser)) {
        socket.emit("yoSent", {
          success: false,
          error: "You are blocked by this user and cannot send Yos",
          blocked: true,
        });
        return;
      }

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

// =====================
// AUTH ENDPOINTS
// =====================

// User signup
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ error: "missing_fields" });
    }

    // Validate username format
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return res.status(400).json({ error: "invalid_username" });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "invalid_email" });
    }

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({ error: "invalid_password" });
    }

    // Check if username already exists
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(409).json({ error: "username_taken" });
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({ error: "email_taken" });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = new User({
      username,
      email,
      password: hashedPassword,
    });

    await user.save();

    // Generate tokens
    const tokenPayload = { id: user._id, username: user.username };
    const { accessToken, refreshToken } =
      jwtService.generateTokenPair(tokenPayload);

    res.status(201).json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "server_error" });
  }
});

// User login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: "missing_fields" });
    }

    // Find user by username or email
    const user = await User.findOne({
      $or: [{ username: identifier }, { email: identifier }],
    });

    if (!user) {
      return res.status(401).json({ error: "invalid_credentials" });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "invalid_credentials" });
    }

    // Generate tokens
    const tokenPayload = { id: user._id, username: user.username };
    const { accessToken, refreshToken } =
      jwtService.generateTokenPair(tokenPayload);

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "server_error" });
  }
});

// Refresh token
app.post("/api/auth/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: "missing_refresh_token" });
    }

    try {
      const decoded = jwtService.verifyToken(refreshToken);

      // Check if user still exists
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({ error: "user_not_found" });
      }

      // Generate new access token
      const tokenPayload = { id: user._id, username: user.username };
      const accessToken = jwtService.generateAccessToken(tokenPayload);

      res.json({ accessToken });
    } catch (error) {
      return res.status(401).json({ error: "invalid_refresh_token" });
    }
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({ error: "server_error" });
  }
});

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

// =====================
// FRIENDS API ENDPOINTS
// =====================

// Search users by username (excluding current user and existing friends)
app.post("/api/friends/search", async (req, res) => {
  try {
    const { username, searchQuery } = req.body;

    if (!username || !searchQuery) {
      return res
        .status(400)
        .json({ error: "Username and search query are required" });
    }

    // Get current user to check existing friends
    const currentUser = await User.findOne({ username });
    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const existingFriends = currentUser.friends || [];

    // Search for users matching the query (case insensitive)
    const searchResults = await User.find(
      {
        username: {
          $regex: searchQuery,
          $options: "i",
          $ne: username, // Exclude current user
        },
      },
      "username isOnline lastSeen"
    )
      .limit(20)
      .sort({ username: 1 });

    // Filter out existing friends and add friendship status
    const filteredResults = searchResults.map((user) => ({
      username: user.username,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
      isFriend: existingFriends.includes(user.username),
      hasReceivedRequest:
        currentUser.friendRequests?.sent?.some(
          (req) => req.to === user.username && req.status === "pending"
        ) || false,
      hasSentRequest:
        currentUser.friendRequests?.received?.some(
          (req) => req.from === user.username && req.status === "pending"
        ) || false,
    }));

    res.json(filteredResults);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send friend request
app.post("/api/friends/request", async (req, res) => {
  try {
    const { fromUser, toUser } = req.body;

    if (!fromUser || !toUser) {
      return res
        .status(400)
        .json({ error: "Both fromUser and toUser are required" });
    }

    if (fromUser === toUser) {
      return res
        .status(400)
        .json({ error: "Cannot send friend request to yourself" });
    }

    // Check if users exist
    const [sender, recipient] = await Promise.all([
      User.findOne({ username: fromUser }),
      User.findOne({ username: toUser }),
    ]);

    if (!sender || !recipient) {
      return res.status(404).json({ error: "One or both users not found" });
    }

    // Check if already friends
    if (sender.friends?.includes(toUser)) {
      return res.status(400).json({ error: "Already friends with this user" });
    }

    // Check if request already exists
    const existingRequest = sender.friendRequests?.sent?.some(
      (req) => req.to === toUser && req.status === "pending"
    );

    if (existingRequest) {
      return res.status(400).json({ error: "Friend request already sent" });
    }

    // Add to sender's sent requests
    await User.findOneAndUpdate(
      { username: fromUser },
      {
        $push: {
          "friendRequests.sent": {
            to: toUser,
            timestamp: new Date(),
            status: "pending",
          },
        },
      }
    );

    // Add to recipient's received requests
    await User.findOneAndUpdate(
      { username: toUser },
      {
        $push: {
          "friendRequests.received": {
            from: fromUser,
            timestamp: new Date(),
            status: "pending",
          },
        },
      }
    );

    // Send real-time notification to recipient if online
    const recipientSocketId = activeUsers.get(toUser);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("friendRequestReceived", {
        from: fromUser,
        timestamp: new Date(),
      });
    }

    res.json({ success: true, message: "Friend request sent successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Accept friend request
app.post("/api/friends/accept", async (req, res) => {
  try {
    const { username, fromUser } = req.body;

    if (!username || !fromUser) {
      return res
        .status(400)
        .json({ error: "Username and fromUser are required" });
    }

    // Update both users' friend requests and add to friends list
    const [updatedRecipient, updatedSender] = await Promise.all([
      // Update recipient (accepting user)
      User.findOneAndUpdate(
        {
          username,
          "friendRequests.received": {
            $elemMatch: { from: fromUser, status: "pending" },
          },
        },
        {
          $set: { "friendRequests.received.$.status": "accepted" },
          $addToSet: { friends: fromUser },
        },
        { new: true }
      ),
      // Update sender
      User.findOneAndUpdate(
        {
          username: fromUser,
          "friendRequests.sent": {
            $elemMatch: { to: username, status: "pending" },
          },
        },
        {
          $set: { "friendRequests.sent.$.status": "accepted" },
          $addToSet: { friends: username },
        },
        { new: true }
      ),
    ]);

    if (!updatedRecipient || !updatedSender) {
      return res
        .status(404)
        .json({ error: "Friend request not found or already processed" });
    }

    // Send real-time notification to sender if online
    const senderSocketId = activeUsers.get(fromUser);
    if (senderSocketId) {
      io.to(senderSocketId).emit("friendRequestAccepted", {
        by: username,
        timestamp: new Date(),
      });
    }

    res.json({ success: true, message: "Friend request accepted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reject friend request
app.post("/api/friends/reject", async (req, res) => {
  try {
    const { username, fromUser } = req.body;

    if (!username || !fromUser) {
      return res
        .status(400)
        .json({ error: "Username and fromUser are required" });
    }

    // Update both users' friend requests
    const [updatedRecipient, updatedSender] = await Promise.all([
      // Update recipient (rejecting user)
      User.findOneAndUpdate(
        {
          username,
          "friendRequests.received": {
            $elemMatch: { from: fromUser, status: "pending" },
          },
        },
        {
          $set: { "friendRequests.received.$.status": "rejected" },
        },
        { new: true }
      ),
      // Update sender
      User.findOneAndUpdate(
        {
          username: fromUser,
          "friendRequests.sent": {
            $elemMatch: { to: username, status: "pending" },
          },
        },
        {
          $set: { "friendRequests.sent.$.status": "rejected" },
        },
        { new: true }
      ),
    ]);

    if (!updatedRecipient || !updatedSender) {
      return res
        .status(404)
        .json({ error: "Friend request not found or already processed" });
    }

    res.json({ success: true, message: "Friend request rejected" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove friend
app.delete("/api/friends/:friendUsername", async (req, res) => {
  try {
    const { username } = req.body;
    const { friendUsername } = req.params;

    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    // Remove from both users' friends lists
    await Promise.all([
      User.findOneAndUpdate(
        { username },
        { $pull: { friends: friendUsername } }
      ),
      User.findOneAndUpdate(
        { username: friendUsername },
        { $pull: { friends: username } }
      ),
    ]);

    res.json({ success: true, message: "Friend removed successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Block user
app.post("/api/users/block", async (req, res) => {
  try {
    const { username, userToBlock } = req.body;

    if (!username || !userToBlock) {
      return res
        .status(400)
        .json({ error: "Username and userToBlock are required" });
    }

    if (username === userToBlock) {
      return res.status(400).json({ error: "Cannot block yourself" });
    }

    // Add to blocked users list and remove from friends list
    await Promise.all([
      User.findOneAndUpdate(
        { username },
        {
          $addToSet: { blockedUsers: userToBlock },
          $pull: { friends: userToBlock },
        }
      ),
      User.findOneAndUpdate(
        { username: userToBlock },
        { $pull: { friends: username } }
      ),
    ]);

    res.json({ success: true, message: "User blocked successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Unblock user
app.post("/api/users/unblock", async (req, res) => {
  try {
    const { username, userToUnblock } = req.body;

    if (!username || !userToUnblock) {
      return res
        .status(400)
        .json({ error: "Username and userToUnblock are required" });
    }

    // Remove from blocked users list
    await User.findOneAndUpdate(
      { username },
      { $pull: { blockedUsers: userToUnblock } }
    );

    res.json({ success: true, message: "User unblocked successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get blocked users list
app.get("/api/users/:username/blocked", async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username }, "blockedUsers");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get detailed info about blocked users
    const blockedUsers = await User.find(
      { username: { $in: user.blockedUsers || [] } },
      "username isOnline lastSeen"
    ).sort({ username: 1 });

    res.json(blockedUsers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's friends list
app.get("/api/friends/:username", async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username }, "friends");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get detailed info about friends
    const friends = await User.find(
      { username: { $in: user.friends || [] } },
      "username isOnline totalYosReceived lastSeen"
    ).sort({ username: 1 });

    res.json(friends);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get friend requests
app.get("/api/friends/requests/:username", async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username }, "friendRequests");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Filter only pending requests
    const pendingReceived =
      user.friendRequests?.received?.filter(
        (req) => req.status === "pending"
      ) || [];
    const pendingSent =
      user.friendRequests?.sent?.filter((req) => req.status === "pending") ||
      [];

    res.json({
      received: pendingReceived,
      sent: pendingSent,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==============================
// SIMPLIFIED USER SEARCH AND ADD
// ==============================

// Simple user search (case-insensitive partial matching)
app.post("/api/users/search", async (req, res) => {
  try {
    const { username, searchQuery } = req.body;

    if (!username || !searchQuery) {
      return res
        .status(400)
        .json({ error: "Username and search query are required" });
    }

    // Get current user to exclude from results
    const currentUser = await User.findOne({ username });
    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const existingFriends = currentUser.friends || [];

    // Search for users matching the query (case insensitive, partial matching)
    const searchResults = await User.find(
      {
        username: {
          $regex: searchQuery,
          $options: "i", // case insensitive
          $ne: username, // exclude current user
        },
      },
      "username isOnline lastSeen totalYosReceived blockedUsers"
    )
      .limit(20) // limit results for performance
      .sort({ username: 1 });

    // Add friend and blocked status to results
    const resultsWithStatus = searchResults.map((user) => ({
      username: user.username,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
      totalYosReceived: user.totalYosReceived,
      isFriend: existingFriends.includes(user.username),
      isBlocked: currentUser.blockedUsers?.includes(user.username) || false,
      hasBlockedYou: user.blockedUsers?.includes(username) || false,
    }));

    res.json(resultsWithStatus);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Instant add user as friend (no requests, instant addition)
app.post("/api/users/add", async (req, res) => {
  try {
    const { fromUser, toUser } = req.body;

    if (!fromUser || !toUser) {
      return res
        .status(400)
        .json({ error: "Both fromUser and toUser are required" });
    }

    if (fromUser === toUser) {
      return res.status(400).json({ error: "Cannot add yourself as a friend" });
    }

    // Check if users exist
    const [sender, recipient] = await Promise.all([
      User.findOne({ username: fromUser }),
      User.findOne({ username: toUser }),
    ]);

    if (!sender || !recipient) {
      return res.status(404).json({ error: "One or both users not found" });
    }

    // Check if already friends
    if (sender.friends?.includes(toUser)) {
      return res.status(400).json({ error: "Already friends with this user" });
    }

    // Instantly add to both users' friends lists
    await Promise.all([
      User.findOneAndUpdate(
        { username: fromUser },
        { $addToSet: { friends: toUser } }
      ),
      User.findOneAndUpdate(
        { username: toUser },
        { $addToSet: { friends: fromUser } }
      ),
    ]);

    // Send real-time notification to recipient if online
    const recipientSocketId = activeUsers.get(toUser);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("friendAdded", {
        from: fromUser,
        timestamp: new Date(),
      });
    }

    res.json({
      success: true,
      message: `Successfully added ${toUser} as a friend!`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = config.PORT;
server.listen(PORT, () => {
  console.log(`Yo App server running on port ${PORT}`);
  console.log(`Socket.IO server ready for connections`);
});
