import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";

export function AppFooter() {
  return (
    <View className="py-6 items-center gap-3">
      <Text className="text-xs text-muted text-center">
        Created by John Dee Page Jr
      </Text>
      <Text className="text-xs text-muted text-center font-semibold">
        © {new Date().getFullYear()} FilmContract. All Rights Reserved.
      </Text>
      <Text className="text-xs text-muted text-center">
        Patent Pending • Proprietary Software
      </Text>
      <View className="flex-row gap-4 mt-2">
        <TouchableOpacity onPress={() => router.push("/legal/terms")} className="active:opacity-70">
          <Text className="text-xs text-primary font-semibold">Terms of Service</Text>
        </TouchableOpacity>
        <Text className="text-xs text-muted">•</Text>
        <TouchableOpacity onPress={() => router.push("/legal/privacy")} className="active:opacity-70">
          <Text className="text-xs text-primary font-semibold">Privacy Policy</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
