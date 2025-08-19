const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    expoPushToken: {
      type: String,
      default: null,
    },
    yosReceived: [
      {
        from: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    totalYosReceived: {
      type: Number,
      default: 0,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    // Friends system
    friends: [
      {
        type: String,
        ref: "User",
      },
    ],
    friendRequests: {
      sent: [
        {
          to: {
            type: String,
            required: true,
          },
          timestamp: {
            type: Date,
            default: Date.now,
          },
          status: {
            type: String,
            enum: ["pending", "accepted", "rejected"],
            default: "pending",
          },
        },
      ],
      received: [
        {
          from: {
            type: String,
            required: true,
          },
          timestamp: {
            type: Date,
            default: Date.now,
          },
          status: {
            type: String,
            enum: ["pending", "accepted", "rejected"],
            default: "pending",
          },
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
userSchema.index({ username: 1 });
userSchema.index({ isOnline: 1 });
userSchema.index({ friends: 1 });
userSchema.index({ "friendRequests.sent.to": 1 });
userSchema.index({ "friendRequests.received.from": 1 });

module.exports = mongoose.model("User", userSchema);
