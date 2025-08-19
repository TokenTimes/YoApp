import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class ExpoNotificationService {
  constructor() {
    this.expoPushToken = null;
    this.notificationListener = null;
    this.responseListener = null;
    this.notificationReceivedCallback = null;
  }

  async initialize() {
    try {
      console.log("🔔 Initializing Expo notifications...");

      // Get push token
      const token = await this.registerForPushNotificationsAsync();
      this.expoPushToken = token;

      // Set up notification listeners
      this.setupNotificationListeners();

      console.log("✅ Expo notifications initialized, token:", token);
      return token;
    } catch (error) {
      console.error("❌ Error initializing Expo notifications:", error);
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

  async handleNotificationReceived(notification) {
    try {
      const data = notification.request.content.data;
      if (data.type === "yo" && data.fromUser) {
        console.log("🎯 Yo notification received from:", data.fromUser);

        // Call the callback if set (MainScreen will set this)
        if (this.notificationReceivedCallback) {
          await this.notificationReceivedCallback({
            from: data.fromUser,
            timestamp: data.timestamp,
          });
        }
      }
    } catch (error) {
      console.error("❌ Error handling notification:", error);
    }
  }

  async handleNotificationResponse(response) {
    try {
      const data = response.notification.request.content.data;
      if (data.type === "yo" && data.fromUser) {
        console.log("👆 User tapped Yo notification from:", data.fromUser);

        // If app was closed and user tapped notification, handle it
        if (this.notificationReceivedCallback) {
          await this.notificationReceivedCallback({
            from: data.fromUser,
            timestamp: data.timestamp,
            fromTap: true,
          });
        }
      }
    } catch (error) {
      console.error("❌ Error handling notification response:", error);
    }
  }

  setNotificationReceivedCallback(callback) {
    this.notificationReceivedCallback = callback;
  }

  async registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
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
        console.log("❌ Failed to get push token for push notification!");
        return null;
      }

      try {
        // Get project ID from app config
        const projectId =
          Constants?.expoConfig?.extra?.eas?.projectId ??
          Constants?.easConfig?.projectId;

        if (!projectId) {
          console.log("❌ Project ID not found in app config");
          return null;
        }

        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        console.log("✅ Got Expo push token:", token);
      } catch (error) {
        console.log("❌ Could not get push token:", error);
        return null;
      }
    } else {
      console.log("❌ Must use physical device for Push Notifications");
      return null;
    }

    return token;
  }

  async showYoNotification(fromUser) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Yo! 👋",
          body: `${fromUser} sent you a Yo!`,
          data: { type: "yo", fromUser },
          sound: "default",
        },
        trigger: null, // Show immediately
      });
      console.log("✅ Local notification shown");
    } catch (error) {
      console.error("❌ Error showing local notification:", error);
    }
  }

  addNotificationResponseReceivedListener(listener) {
    this.responseListener =
      Notifications.addNotificationResponseReceivedListener(listener);
    return this.responseListener;
  }

  addNotificationReceivedListener(listener) {
    this.notificationListener =
      Notifications.addNotificationReceivedListener(listener);
    return this.notificationListener;
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

  getExpoPushToken() {
    return this.expoPushToken;
  }
}

export default new ExpoNotificationService();
