import { View, Text, Switch, Platform } from "react-native";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColors } from "@/hooks/use-colors";
import { registerForPushNotifications } from "@/lib/notifications";

const NOTIFICATION_PREFS_KEY = "@notification_prefs";

interface NotificationPrefs {
  contractCreated: boolean;
  paymentReceived: boolean;
  contractStatusChanged: boolean;
}

export function NotificationSettings() {
  const colors = useColors();
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    contractCreated: true,
    paymentReceived: true,
    contractStatusChanged: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
    if (Platform.OS !== "web") {
      registerForPushNotifications();
    }
  }, []);

  const loadPreferences = async () => {
    try {
      const saved = await AsyncStorage.getItem(NOTIFICATION_PREFS_KEY);
      if (saved) {
        setPrefs(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Error loading notification preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (key: keyof NotificationPrefs, value: boolean) => {
    const newPrefs = { ...prefs, [key]: value };
    setPrefs(newPrefs);
    try {
      await AsyncStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(newPrefs));
    } catch (error) {
      console.error("Error saving notification preferences:", error);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <View className="bg-surface rounded-xl p-4 gap-4">
      <Text className="text-lg font-bold text-foreground">Notification Preferences</Text>

      <View className="flex-row justify-between items-center">
        <View className="flex-1">
          <Text className="text-base text-foreground font-medium">New Contracts</Text>
          <Text className="text-sm text-muted">Notify when a contract is created for you</Text>
        </View>
        <Switch
          value={prefs.contractCreated}
          onValueChange={(value) => updatePreference("contractCreated", value)}
          trackColor={{ false: "#d1d5db", true: colors.primary }}
          thumbColor="#ffffff"
        />
      </View>

      <View className="h-px bg-border" />

      <View className="flex-row justify-between items-center">
        <View className="flex-1">
          <Text className="text-base text-foreground font-medium">Payments</Text>
          <Text className="text-sm text-muted">Notify when you receive a payment</Text>
        </View>
        <Switch
          value={prefs.paymentReceived}
          onValueChange={(value) => updatePreference("paymentReceived", value)}
          trackColor={{ false: "#d1d5db", true: colors.primary }}
          thumbColor="#ffffff"
        />
      </View>

      <View className="h-px bg-border" />

      <View className="flex-row justify-between items-center">
        <View className="flex-1">
          <Text className="text-base text-foreground font-medium">Status Changes</Text>
          <Text className="text-sm text-muted">Notify when contract status changes</Text>
        </View>
        <Switch
          value={prefs.contractStatusChanged}
          onValueChange={(value) => updatePreference("contractStatusChanged", value)}
          trackColor={{ false: "#d1d5db", true: colors.primary }}
          thumbColor="#ffffff"
        />
      </View>

      {Platform.OS === "web" && (
        <View className="bg-warning/10 border border-warning rounded-lg p-3 mt-2">
          <Text className="text-sm text-muted">
            ℹ️ Push notifications are not supported on web. These settings will apply when using the mobile app.
          </Text>
        </View>
      )}
    </View>
  );
}
