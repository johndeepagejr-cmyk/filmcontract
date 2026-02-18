import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { trpc } from "@/lib/trpc";

// Configure notification behavior
if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
  const responseListener = useRef<Notifications.Subscription | undefined>(undefined);

  const registerTokenMutation = trpc.notifications.registerPushToken.useMutation({});

  useEffect(() => {
    // Register for push notifications
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        setExpoPushToken(token);
        // Send token to server
        registerTokenMutation.mutate({ pushToken: token }, {
          onError: (error: any) => {
            console.error("Failed to register push token:", error);
          },
        });
      }
    });

    // Listen for incoming notifications
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        setNotification(notification);
      }
    );

    // Listen for notification interactions
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
      console.log("Notification tapped:", response);
      // Handle navigation based on notification data
      const data = response.notification.request.content.data;
      if (data.type === "contract_created" || data.type === "contract_signed") {
        // Navigate to contracts screen
        // router.push("/(tabs)/");
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return {
    expoPushToken,
    notification,
  };
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
  // Only works on physical devices
  if (!Device.isDevice) {
    console.log("Push notifications only work on physical devices");
    return null;
  }

  // Web doesn't support Expo push notifications
  if (Platform.OS === "web") {
    return null;
  }

  try {
    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not granted
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Push notification permission not granted");
      return null;
    }

    // Get the push token
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: "your-project-id", // This will be auto-filled by Expo
    });

    // Android-specific channel setup
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    return token.data;
  } catch (error) {
    console.error("Error registering for push notifications:", error);
    return null;
  }
}
