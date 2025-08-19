// Expo Push Notification Service
const { Expo } = require("expo-server-sdk");
const config = require("../config");

class ExpoPushService {
  constructor() {
    // Create a new Expo SDK client
    this.expo = new Expo({
      accessToken: config.EXPO_ACCESS_TOKEN, // Optional: for higher rate limits
      useFcmV1: false, // Use legacy FCM format for better compatibility
    });

    // Store FCM server key for direct FCM fallback
    this.fcmServerKey = config.FCM_SERVER_KEY;

    console.log("🔔 Expo Push Service initialized");
    console.log(
      "🔑 FCM Server Key:",
      this.fcmServerKey ? "✅ Configured" : "❌ Missing"
    );
  }

  async sendYoNotification(expoPushToken, fromUser) {
    try {
      // Check that the push token is valid
      if (!Expo.isExpoPushToken(expoPushToken)) {
        console.error(`Invalid Expo push token: ${expoPushToken}`);
        return { success: false, error: "Invalid push token" };
      }

      // Construct the message following Expo best practices
      const message = {
        to: expoPushToken,
        sound: "yo-sound.wav", // Custom Yo sound file
        title: "Yo! 👋",
        body: `${fromUser} sent you a Yo!`,
        data: {
          type: "yo",
          fromUser: fromUser,
          timestamp: new Date().toISOString(),
          action: "yo_received", // For handling specific actions
        },
        priority: "high", // High priority for immediate delivery
        ttl: 3600, // 1 hour TTL (reasonable for real-time messaging)
        channelId: "yo-notifications", // Android notification channel
        badge: 1, // iOS badge increment
        categoryId: "yo-category", // For notification categories/actions
      };

      console.log("📤 Sending Yo notification:", {
        to: expoPushToken,
        fromUser,
      });

      // Send the notification
      const chunks = this.expo.chunkPushNotifications([message]);
      const tickets = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error("Error sending notification chunk:", error);
        }
      }

      // Check if the notification was sent successfully
      if (tickets.length > 0) {
        const ticket = tickets[0];
        if (ticket.status === "ok") {
          console.log(
            "✅ Yo notification sent successfully, receipt ID:",
            ticket.id
          );

          // Schedule receipt check for 15 minutes later (as recommended)
          setTimeout(() => {
            this.checkPushReceipt(ticket.id);
          }, 15 * 60 * 1000); // 15 minutes

          return { success: true, ticket, receiptId: ticket.id };
        } else {
          console.error("❌ Notification failed:", ticket);

          // Handle specific errors
          if (
            ticket.details &&
            ticket.details.error === "DeviceNotRegistered"
          ) {
            console.log(
              "🚫 Device not registered, should remove token from database"
            );
            return {
              success: false,
              error: ticket.message,
              shouldRemoveToken: true,
            };
          }

          return { success: false, error: ticket.message };
        }
      } else {
        return { success: false, error: "No tickets received" };
      }
    } catch (error) {
      console.error("❌ Error sending Yo notification:", error);
      return { success: false, error: error.message };
    }
  }

  async sendToMultipleTokens(expoPushTokens, fromUser) {
    try {
      // Filter out invalid tokens
      const validTokens = expoPushTokens.filter((token) =>
        Expo.isExpoPushToken(token)
      );

      if (validTokens.length === 0) {
        return { success: false, error: "No valid push tokens" };
      }

      // Create messages for all valid tokens
      const messages = validTokens.map((token) => ({
        to: token,
        sound: "default",
        title: "Yo!",
        body: `${fromUser} sent you a Yo!`,
        data: {
          type: "yo",
          fromUser: fromUser,
          timestamp: new Date().toISOString(),
        },
        priority: "high",
        channelId: "yo-notifications",
      }));

      console.log(
        `📤 Sending Yo notifications to ${validTokens.length} devices`
      );

      // Send the notifications in chunks
      const chunks = this.expo.chunkPushNotifications(messages);
      const tickets = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error("Error sending notification chunk:", error);
        }
      }

      // Count successful and failed notifications
      let successCount = 0;
      let failureCount = 0;

      tickets.forEach((ticket) => {
        if (ticket.status === "ok") {
          successCount++;
        } else {
          failureCount++;
          console.error("Failed ticket:", ticket);
        }
      });

      console.log(`✅ Sent to ${successCount}/${validTokens.length} devices`);

      return {
        success: true,
        successCount,
        failureCount,
        totalSent: validTokens.length,
      };
    } catch (error) {
      console.error("❌ Error sending multicast notifications:", error);
      return { success: false, error: error.message };
    }
  }

  async checkPushReceipt(receiptId) {
    try {
      console.log("🧾 Checking push receipt for:", receiptId);

      const receipts = await this.expo.getPushNotificationReceiptsAsync([
        receiptId,
      ]);
      const receipt = receipts[receiptId];

      if (!receipt) {
        console.log("⏳ Receipt not yet available for:", receiptId);
        return;
      }

      if (receipt.status === "ok") {
        console.log("✅ Push notification delivered successfully:", receiptId);
      } else if (receipt.status === "error") {
        console.error("❌ Push notification delivery failed:", receipt.message);

        if (receipt.details && receipt.details.error) {
          const errorCode = receipt.details.error;
          console.log("Error code:", errorCode);

          if (errorCode === "DeviceNotRegistered") {
            console.log(
              "🚫 Device not registered, should remove token from database"
            );
            // TODO: Implement token removal from database
          } else if (errorCode === "MessageTooBig") {
            console.log("📏 Message too big, reduce payload size");
          } else if (errorCode === "MessageRateExceeded") {
            console.log("🚦 Message rate exceeded, implement backoff");
          } else if (errorCode === "InvalidCredentials") {
            console.log("🔑 Invalid credentials, check push credentials");
          }
        }
      }
    } catch (error) {
      console.error("❌ Error checking push receipt:", error);
    }
  }

  async handlePushReceipts(receiptIds) {
    try {
      const receiptIdChunks =
        this.expo.chunkPushNotificationReceiptIds(receiptIds);

      for (const chunk of receiptIdChunks) {
        try {
          const receipts = await this.expo.getPushNotificationReceiptsAsync(
            chunk
          );

          // Process receipts to handle errors
          for (const receiptId in receipts) {
            const receipt = receipts[receiptId];

            if (receipt.status === "ok") {
              continue;
            } else if (receipt.status === "error") {
              console.error(`Error in receipt ${receiptId}:`, receipt.message);

              if (receipt.details && receipt.details.error) {
                const errorCode = receipt.details.error;

                if (errorCode === "DeviceNotRegistered") {
                  // The device token is no longer valid, remove it from database
                  console.log("Device token is no longer valid:", receiptId);
                  // TODO: Remove invalid token from database
                }
              }
            }
          }
        } catch (error) {
          console.error("Error getting receipts:", error);
        }
      }
    } catch (error) {
      console.error("Error handling push receipts:", error);
    }
  }
}

module.exports = new ExpoPushService();
