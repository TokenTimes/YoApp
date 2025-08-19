// Firebase Cloud Messaging service
import messaging from "@react-native-firebase/messaging";
import { Platform, Alert } from "react-native";
import Toast from "react-native-toast-message";
import SoundService from "./sound";

class FirebaseService {
  constructor() {
    this.fcmToken = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Request permission for iOS
      if (Platform.OS === "ios") {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (!enabled) {
          console.log("Push notification permissions not granted");
          return false;
        }
      }

      // Get FCM token
      const token = await messaging().getToken();
      this.fcmToken = token;
      console.log("🔥 Firebase FCM Token:", token);

      // Set up message handlers
      this.setupMessageHandlers();

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error("Error initializing Firebase:", error);
      return false;
    }
  }

  setupMessageHandlers() {
    // Handle messages when app is in foreground
    messaging().onMessage(async (remoteMessage) => {
      console.log("📱 Foreground message received:", remoteMessage);
      await this.handleForegroundMessage(remoteMessage);
    });

    // Handle messages when app is in background/quit
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log("📱 Background message opened app:", remoteMessage);
      this.handleBackgroundMessage(remoteMessage);
    });

    // Handle messages when app is opened from quit state
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log("📱 App opened from quit state:", remoteMessage);
          this.handleBackgroundMessage(remoteMessage);
        }
      });

    // Handle token refresh
    messaging().onTokenRefresh((token) => {
      console.log("🔄 FCM Token refreshed:", token);
      this.fcmToken = token;
      // You might want to update the token on your server here
    });
  }

  async handleForegroundMessage(remoteMessage) {
    const { notification, data } = remoteMessage;

    if (data?.type === "yo" && data?.fromUser) {
      // Play custom sound
      await SoundService.playYoSound();

      // Show toast notification
      Toast.show({
        type: "success",
        text1: "🎉 Yo!",
        text2: `${data.fromUser} sent you a Yo!`,
        visibilityTime: 3000,
        autoHide: true,
        topOffset: 60,
        props: {
          onPress: () => {
            Toast.hide();
            // Handle tap if needed
          },
        },
      });
    }
  }

  handleBackgroundMessage(remoteMessage) {
    const { notification, data } = remoteMessage;

    if (data?.type === "yo" && data?.fromUser) {
      console.log(`Yo received from ${data.fromUser} (background)`);
      // The sound will be played by the system notification
      // You can handle navigation or other logic here
    }
  }

  getFCMToken() {
    return this.fcmToken;
  }

  async subscribeToTopic(topic) {
    try {
      await messaging().subscribeToTopic(topic);
      console.log(`Subscribed to topic: ${topic}`);
    } catch (error) {
      console.error("Error subscribing to topic:", error);
    }
  }

  async unsubscribeFromTopic(topic) {
    try {
      await messaging().unsubscribeFromTopic(topic);
      console.log(`Unsubscribed from topic: ${topic}`);
    } catch (error) {
      console.error("Error unsubscribing from topic:", error);
    }
  }
}

export default new FirebaseService();
