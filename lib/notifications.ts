import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import Constants from "expo-constants";

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

export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === "web") {
    // Push notifications not supported on web
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Failed to get push token for push notification!");
      return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const token = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    return token.data;
  } catch (error) {
    console.error("Error registering for push notifications:", error);
    return null;
  }
}

export interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
}

export async function sendLocalNotification(notification: NotificationData) {
  if (Platform.OS === "web") {
    // Show browser notification or alert on web
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(notification.title, {
        body: notification.body,
      });
    }
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
    },
    trigger: null, // Show immediately
  });
}

// Notification templates
export const NotificationTemplates = {
  contractCreated: (projectTitle: string, actorName: string) => ({
    title: "New Contract Created",
    body: `A new contract for "${projectTitle}" has been created for ${actorName}`,
    data: { type: "contract_created" },
  }),

  paymentReceived: (projectTitle: string, amount: string) => ({
    title: "Payment Received",
    body: `You received a payment of $${amount} for "${projectTitle}"`,
    data: { type: "payment_received" },
  }),

  contractStatusChanged: (projectTitle: string, status: string) => ({
    title: "Contract Status Updated",
    body: `Contract "${projectTitle}" status changed to ${status}`,
    data: { type: "contract_status_changed" },
  }),

  contractEdited: (projectTitle: string) => ({
    title: "Contract Updated",
    body: `Contract "${projectTitle}" has been edited`,
    data: { type: "contract_edited" },
  }),
};
