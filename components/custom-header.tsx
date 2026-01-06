import { View, Text, TouchableOpacity } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

interface CustomHeaderProps {
  title: string;
  onBack?: () => void;
}

export function CustomHeader({ title, onBack }: CustomHeaderProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (onBack) {
      onBack();
    } else {
      // Navigate back to home tab
      router.push("/");
    }
  };

  return (
    <View
      className="flex-row items-center px-4 border-b border-border"
      style={{
        paddingTop: insets.top + 12,
        paddingBottom: 12,
        backgroundColor: colors.background,
        borderBottomColor: colors.border,
      }}
    >
      <TouchableOpacity
        onPress={handleBack}
        className="mr-3 p-2 active:opacity-70"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text className="text-2xl" style={{ color: colors.primary }}>
          ←
        </Text>
      </TouchableOpacity>
      <Text className="text-xl font-bold text-foreground flex-1" style={{ color: colors.foreground }}>
        {title}
      </Text>
    </View>
  );
}
