import { View, Text } from "react-native";

export function AppFooter() {
  return (
    <View className="py-6 items-center">
      <Text className="text-xs text-muted text-center">
        Created by John Dee Page Jr
      </Text>
      <Text className="text-xs text-muted text-center mt-1">
        © {new Date().getFullYear()} FilmContract
      </Text>
    </View>
  );
}
