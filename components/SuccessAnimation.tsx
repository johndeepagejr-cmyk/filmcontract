import { Text, View, StyleSheet, Platform } from "react-native";
import { useEffect } from "react";
import { useColors } from "@/hooks/use-colors";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, withSequence, Easing } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

interface SuccessAnimationProps {
  title?: string;
  message?: string;
  icon?: string;
}

export function SuccessAnimation({ title = "Success!", message, icon = "checkmark" }: SuccessAnimationProps) {
  const colors = useColors();
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    // Animate in
    scale.value = withSequence(
      withTiming(1.15, { duration: 300, easing: Easing.out(Easing.back(1.5)) }),
      withTiming(1, { duration: 150 })
    );
    opacity.value = withTiming(1, { duration: 200 });
    textOpacity.value = withDelay(250, withTiming(1, { duration: 300 }));

    // Haptic feedback
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, []);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.circle, { backgroundColor: colors.success + "15" }, circleStyle]}>
        <View style={[styles.innerCircle, { backgroundColor: colors.success }]}>
          <Text style={styles.checkmark}>✓</Text>
        </View>
      </Animated.View>
      <Animated.View style={[styles.textContainer, textStyle]}>
        <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
        {message && <Text style={[styles.message, { color: colors.muted }]}>{message}</Text>}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center", gap: 20, padding: 32 },
  circle: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center" },
  innerCircle: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  checkmark: { color: "#fff", fontSize: 32, fontWeight: "800" },
  textContainer: { alignItems: "center", gap: 6 },
  title: { fontSize: 22, fontWeight: "800" },
  message: { fontSize: 14, textAlign: "center", lineHeight: 20 },
});
