import { View, StyleSheet } from "react-native";
import { useEffect } from "react";
import { useColors } from "@/hooks/use-colors";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from "react-native-reanimated";

interface LoadingSkeletonProps {
  lines?: number;
  showAvatar?: boolean;
  cardStyle?: boolean;
}

function SkeletonLine({ width, height = 14 }: { width: string; height?: number }) {
  const colors = useColors();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        { height, borderRadius: height / 2, backgroundColor: colors.border, width: width as any },
        animatedStyle,
      ]}
    />
  );
}

export function LoadingSkeleton({ lines = 3, showAvatar = false, cardStyle = true }: LoadingSkeletonProps) {
  const colors = useColors();
  const widths = ["80%", "60%", "90%", "45%", "70%"];

  return (
    <View style={[cardStyle && styles.card, cardStyle && { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {showAvatar && (
        <View style={styles.avatarRow}>
          <SkeletonLine width="44" height={44} />
          <View style={styles.avatarText}>
            <SkeletonLine width="60%" height={16} />
            <SkeletonLine width="40%" height={12} />
          </View>
        </View>
      )}
      <View style={styles.lines}>
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonLine key={i} width={widths[i % widths.length]} height={i === 0 ? 18 : 12} />
        ))}
      </View>
    </View>
  );
}

export function LoadingSkeletonList({ count = 3, ...props }: LoadingSkeletonProps & { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <LoadingSkeleton key={i} {...props} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 10 },
  avatarRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 },
  avatarText: { flex: 1, gap: 6 },
  lines: { gap: 8 },
  list: { gap: 12 },
});
