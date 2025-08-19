import { useState, useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function handleRegistrationError(errorMessage) {
  console.error("Push notification registration error:", errorMessage);
  throw new Error(errorMessage);
}

async function registerForPushNotificationsAsync() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("yo-notifications", {
      name: "Yo Notifications",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#6366f1",
      sound: "yo-sound.wav", // Custom sound
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      handleRegistrationError(
        "Permission not granted to get push token for push notification!"
      );
      return null;
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    if (!projectId) {
      handleRegistrationError("Project ID not found");
      return null;
    }

    try {
      const pushTokenString = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
      console.log("✅ Expo Push Token:", pushTokenString);
      return pushTokenString;
    } catch (e) {
      handleRegistrationError(`Failed to get push token: ${e}`);
      return null;
    }
  } else {
    handleRegistrationError("Must use physical device for push notifications");
    return null;
  }
}

class PushNotificationService {
  constructor() {
    this.expoPushToken = null;
    this.notificationListener = null;
    this.responseListener = null;
    this.notificationCallback = null;
  }

  async initialize() {
    try {
      console.log("🔔 Initializing push notifications...");

      // Register for push notifications
      this.expoPushToken = await registerForPushNotificationsAsync();

      if (this.expoPushToken) {
        console.log("✅ Push notifications initialized successfully");
        this.setupNotificationListeners();
        return this.expoPushToken;
      } else {
        console.log("❌ Failed to initialize push notifications");
        return null;
      }
    } catch (error) {
      console.error("❌ Error initializing push notifications:", error);
      return null;
    }
  }

  setupNotificationListeners() {
    // Listen for notifications received while app is in foreground
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("🔔 Notification received in foreground:", notification);
        this.handleNotificationReceived(notification);
      }
    );

    // Listen for notification responses (when user taps notification)
    this.responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("👆 Notification response received:", response);
        this.handleNotificationResponse(response);
      });
  }

  handleNotificationReceived(notification) {
    try {
      const data = notification.request.content.data;
      if (data.type === "yo" && data.fromUser) {
        console.log("🎯 Yo notification received from:", data.fromUser);

        // Call the callback if set
        if (this.notificationCallback) {
          this.notificationCallback({
            from: data.fromUser,
            timestamp: data.timestamp,
            type: "received",
          });
        }
      }
    } catch (error) {
      console.error("❌ Error handling notification:", error);
    }
  }

  handleNotificationResponse(response) {
    try {
      const data = response.notification.request.content.data;
      if (data.type === "yo" && data.fromUser) {
        console.log("👆 User tapped Yo notification from:", data.fromUser);

        // Call the callback if set
        if (this.notificationCallback) {
          this.notificationCallback({
            from: data.fromUser,
            timestamp: data.timestamp,
            type: "tapped",
          });
        }
      }
    } catch (error) {
      console.error("❌ Error handling notification response:", error);
    }
  }

  setNotificationCallback(callback) {
    this.notificationCallback = callback;
  }

  getExpoPushToken() {
    return this.expoPushToken;
  }

  async scheduleLocalNotification(fromUser) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Yo! 👋",
          body: `${fromUser} sent you a Yo!`,
          data: { type: "yo", fromUser },
          sound: "yo-sound.wav",
        },
        trigger: null, // Show immediately
      });
      console.log("✅ Local notification scheduled");
    } catch (error) {
      console.error("❌ Error scheduling local notification:", error);
    }
  }

  cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
      this.notificationListener = null;
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
      this.responseListener = null;
    }
  }
}

export default new PushNotificationService();
