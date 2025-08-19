import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class ExpoNotificationService {
  constructor() {
    this.expoPushToken = null;
    this.notificationListener = null;
    this.responseListener = null;
  }

  async initialize() {
    try {
      console.log("🔔 Initializing Expo notifications...");

      // Get push token
      const token = await this.registerForPushNotificationsAsync();
      this.expoPushToken = token;

      console.log("✅ Expo notifications initialized, token:", token);
      return token;
    } catch (error) {
      console.error("❌ Error initializing Expo notifications:", error);
      return null;
    }
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
        token = (await Notifications.getExpoPushTokenAsync()).data;
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
