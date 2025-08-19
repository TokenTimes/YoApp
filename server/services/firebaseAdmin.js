// Firebase Admin SDK for sending push notifications
const admin = require("firebase-admin");

class FirebaseAdminService {
  constructor() {
    this.isInitialized = false;
  }

  initialize() {
    try {
      // Initialize Firebase Admin (you'll need to add your service account key)
      if (!admin.apps.length) {
        // For now, we'll use a placeholder
        // You'll need to replace this with your actual Firebase service account
        console.log(
          "⚠️  Firebase Admin not initialized - add your service account key"
        );
        console.log("📋 Steps to configure:");
        console.log(
          "1. Go to Firebase Console > Project Settings > Service Accounts"
        );
        console.log("2. Generate new private key");
        console.log("3. Save as server/firebase-service-account.json");
        console.log("4. Uncomment the initialization code below");

        // Uncomment and configure this when you have your service account:
        /*
        admin.initializeApp({
          credential: admin.credential.cert(require('../firebase-service-account.json')),
          projectId: 'yoapp-af4b4', // Your Firebase project ID
        });
        */

        this.isInitialized = false;
        return false;
      }

      this.isInitialized = true;
      console.log("🔥 Firebase Admin initialized successfully");
      return true;
    } catch (error) {
      console.error("Error initializing Firebase Admin:", error);
      this.isInitialized = false;
      return false;
    }
  }

  async sendYoNotification(targetFCMToken, fromUser) {
    if (!this.isInitialized) {
      console.log(
        "Firebase Admin not initialized - using local notification fallback"
      );
      return { success: false, error: "Firebase not configured" };
    }

    try {
      const message = {
        notification: {
          title: "Yo!",
          body: `${fromUser} sent you a Yo!`,
        },
        data: {
          type: "yo",
          fromUser: fromUser,
          timestamp: new Date().toISOString(),
        },
        android: {
          notification: {
            icon: "ic_notification",
            color: "#6366f1",
            sound: "yo_sound", // Custom sound file
            channelId: "yo_notifications",
          },
          priority: "high",
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: "Yo!",
                body: `${fromUser} sent you a Yo!`,
              },
              sound: "yo-sound.wav", // Custom sound file
              badge: 1,
            },
          },
        },
        token: targetFCMToken,
      };

      const response = await admin.messaging().send(message);
      console.log("✅ Yo notification sent successfully:", response);
      return { success: true, messageId: response };
    } catch (error) {
      console.error("❌ Error sending Yo notification:", error);
      return { success: false, error: error.message };
    }
  }

  async sendToMultipleDevices(fcmTokens, fromUser) {
    if (!this.isInitialized) {
      console.log("Firebase Admin not initialized");
      return { success: false, error: "Firebase not configured" };
    }

    try {
      const message = {
        notification: {
          title: "Yo!",
          body: `${fromUser} sent you a Yo!`,
        },
        data: {
          type: "yo",
          fromUser: fromUser,
          timestamp: new Date().toISOString(),
        },
        android: {
          notification: {
            icon: "ic_notification",
            color: "#6366f1",
            sound: "yo_sound",
            channelId: "yo_notifications",
          },
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: "Yo!",
                body: `${fromUser} sent you a Yo!`,
              },
              sound: "yo-sound.wav",
            },
          },
        },
        tokens: fcmTokens,
      };

      const response = await admin.messaging().sendMulticast(message);
      console.log(
        `✅ Sent to ${response.successCount}/${fcmTokens.length} devices`
      );

      if (response.failureCount > 0) {
        console.log(
          "❌ Failed tokens:",
          response.responses
            .map((resp, idx) => (resp.success ? null : fcmTokens[idx]))
            .filter((token) => token)
        );
      }

      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error) {
      console.error("❌ Error sending multicast notification:", error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new FirebaseAdminService();
