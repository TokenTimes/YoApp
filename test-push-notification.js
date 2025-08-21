#!/usr/bin/env node

/**
 * Test Push Notification Script
 *
 * This script helps you test custom notification sounds on your device.
 *
 * Usage:
 * node test-push-notification.js ExponentPushToken[YOUR_TOKEN_HERE]
 */

const https = require("https");

function sendTestNotification(pushToken) {
  const data = JSON.stringify({
    to: pushToken,
    sound: "yo_sound.caf", // Custom sound for iOS
    title: "🔊 Custom Sound Test",
    body: "This should play your custom Yo sound!",
    priority: "high",
    data: {
      type: "test",
      timestamp: new Date().toISOString(),
    },
  });

  const options = {
    hostname: "exp.host",
    port: 443,
    path: "/--/api/v2/push/send",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": data.length,
    },
  };

  console.log("🚀 Sending test notification...");
  console.log("📱 Target token:", pushToken);
  console.log("🔊 Sound file: yo_sound.caf");

  const req = https.request(options, (res) => {
    console.log(`📊 Status: ${res.statusCode}`);

    let responseData = "";
    res.on("data", (chunk) => {
      responseData += chunk;
    });

    res.on("end", () => {
      try {
        const response = JSON.parse(responseData);
        console.log("✅ Response:", JSON.stringify(response, null, 2));

        if (response.data && response.data.status === "ok") {
          console.log("🎉 Notification sent successfully!");
          console.log("📋 Receipt ID:", response.data.id);
        } else {
          console.log("❌ Notification failed:", response);
        }
      } catch (error) {
        console.log("📄 Raw response:", responseData);
      }
    });
  });

  req.on("error", (error) => {
    console.error("❌ Error sending notification:", error.message);
  });

  req.write(data);
  req.end();
}

// Main execution
const pushToken = process.argv[2];

if (!pushToken) {
  console.log("❌ Error: Push token is required");
  console.log("");
  console.log("Usage:");
  console.log(
    "  node test-push-notification.js ExponentPushToken[YOUR_TOKEN_HERE]"
  );
  console.log("");
  console.log("To get your push token, add this to your app temporarily:");
  console.log("");
  console.log('  import * as Notifications from "expo-notifications";');
  console.log("  const token = await Notifications.getExpoPushTokenAsync();");
  console.log('  console.log("Push Token:", token.data);');
  console.log("");
  process.exit(1);
}

if (!pushToken.startsWith("ExponentPushToken[")) {
  console.log("❌ Error: Invalid push token format");
  console.log("Expected format: ExponentPushToken[...]");
  process.exit(1);
}

sendTestNotification(pushToken);
