// Notification service using Expo Notifications
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  constructor() {
    this.expoPushToken = null;
  }

  async registerForPushNotificationsAsync() {
    let token;

    try {
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#6366f1",
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

        // Try to get push token with projectId
        try {
          const projectId = Constants.expoConfig?.extra?.eas?.projectId || 
                           Constants.expoConfig?.projectId || 
                           "yo-app-mobile";
          
          token = (await Notifications.getExpoPushTokenAsync({
            projectId: projectId,
          })).data;
          console.log("Expo Push Token:", token);
        } catch (tokenError) {
          console.log("Could not get push token:", tokenError.message);
          console.log("App will continue without push notifications");
          // Continue without push token - app will still work with local notifications
          token = null;
        }
      } else {
        console.log("Push notifications require physical device");
        token = null;
      }
    } catch (error) {
      console.log("Error setting up push notifications:", error.message);
      token = null;
    }

    this.expoPushToken = token;
    return token;
  }

  async scheduleLocalNotification(title, body, data = {}) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // Show immediately
    });
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

  addNotificationReceivedListener(listener) {
    return Notifications.addNotificationReceivedListener(listener);
  }

  addNotificationResponseReceivedListener(listener) {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }
}

export default new NotificationService();

