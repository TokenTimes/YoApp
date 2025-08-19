// Improved Expo Notifications service with server-side push notifications
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import Toast from "react-native-toast-message";
import SoundService from "./sound";

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
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Set up notification channel for Android
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("yo-notifications", {
          name: "Yo Notifications",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#6366f1",
          sound: "yo-sound.wav", // Custom sound
          enableVibrate: true,
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
          console.log("Push notification permissions not granted");
          return null;
        }

        // Get Expo push token with explicit project configuration
        try {
          const projectId = "yo-app-mobile"; // Your project ID from app.json

          const pushToken = await Notifications.getExpoPushTokenAsync({
            projectId: projectId,
          });

          this.expoPushToken = pushToken.data;
          console.log("🔔 Expo Push Token:", this.expoPushToken);
        } catch (tokenError) {
          console.log("Could not get push token:", tokenError.message);
          return null;
        }
      } else {
        console.log("Push notifications require physical device");
        return null;
      }

      // Set up message handlers
      this.setupMessageHandlers();

      this.isInitialized = true;
      return this.expoPushToken;
    } catch (error) {
      console.error("Error initializing notifications:", error);
      return null;
    }
  }

  setupMessageHandlers() {
    // Handle messages when app is in foreground
    Notifications.addNotificationReceivedListener(async (notification) => {
      console.log("📱 Foreground notification received:", notification);
      await this.handleForegroundNotification(notification);
    });

    // Handle messages when app is opened from background/quit
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("📱 Notification response received:", response);
      this.handleNotificationResponse(response);
    });
  }

  async handleForegroundNotification(notification) {
    const { request } = notification;
    const { content } = request;

    if (content.data?.type === "yo" && content.data?.fromUser) {
      // Play custom sound
      await SoundService.playYoSound();

      // Show toast notification
      Toast.show({
        type: "success",
        text1: "🎉 Yo!",
        text2: `${content.data.fromUser} sent you a Yo!`,
        visibilityTime: 3000,
        autoHide: true,
        topOffset: 60,
        props: {
          onPress: () => {
            Toast.hide();
          },
        },
      });
    }
  }

  handleNotificationResponse(response) {
    const { notification } = response;
    const { request } = notification;
    const { content } = request;

    if (content.data?.type === "yo" && content.data?.fromUser) {
      console.log(`Yo notification tapped from ${content.data.fromUser}`);
      // Handle navigation or other logic here
    }
  }

  async scheduleLocalNotification(title, body, data = {}) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: "yo-sound.wav",
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error("Error scheduling local notification:", error);
    }
  }

  async showYoNotification(fromUser) {
    await this.scheduleLocalNotification("Yo!", `${fromUser} sent you a Yo!`, {
      type: "yo",
      fromUser,
    });
  }

  getExpoPushToken() {
    return this.expoPushToken;
  }

  async testNotification() {
    // For testing purposes
    await this.scheduleLocalNotification(
      "Test Yo!",
      "This is a test notification with custom sound",
      { type: "test" }
    );
  }
}

export default new ExpoNotificationService();
