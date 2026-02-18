import { View, Text, StyleSheet } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { Typography } from "@/constants/design-tokens";

type BadgeType = "verified" | "imdb" | "sag" | "pro" | "studio" | "top_rated";

interface Props {
  type: BadgeType;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const BADGE_CONFIG: Record<BadgeType, { icon: string; label: string; color: string }> = {
  verified: { icon: "✓", label: "Verified", color: "#3B82F6" },
  imdb: { icon: "★", label: "IMDb", color: "#F5C518" },
  sag: { icon: "🎭", label: "SAG-AFTRA", color: "#8B5CF6" },
  pro: { icon: "⚡", label: "Pro", color: "#C9963B" },
  studio: { icon: "🏆", label: "Studio", color: "#C9963B" },
  top_rated: { icon: "🔥", label: "Top Rated", color: "#EF4444" },
};

const SIZES = {
  sm: { badge: 18, icon: 10, font: 10 },
  md: { badge: 24, icon: 14, font: 12 },
  lg: { badge: 32, icon: 18, font: 14 },
};

export function VerificationBadge({ type, size = "md", showLabel = false }: Props) {
  const colors = useColors();
  const config = BADGE_CONFIG[type];
  const s = SIZES[size];

  return (
    <View style={[styles.container, showLabel && { gap: 4 }]}>
      <View style={[styles.badge, {
        width: s.badge, height: s.badge, borderRadius: s.badge / 2,
        backgroundColor: config.color + "20",
        borderWidth: 1.5, borderColor: config.color + "40",
      }]}>
        <Text style={{ fontSize: s.icon, color: config.color, fontWeight: "800" }}>
          {config.icon}
        </Text>
      </View>
      {showLabel && (
        <Text style={[Typography.caption, { color: config.color, fontWeight: "600", fontSize: s.font }]}>
          {config.label}
        </Text>
      )}
    </View>
  );
}

export function BadgeRow({ badges, size = "sm" }: { badges: BadgeType[]; size?: "sm" | "md" }) {
  return (
    <View style={{ flexDirection: "row", gap: 4, alignItems: "center" }}>
      {badges.map((b) => (
        <VerificationBadge key={b} type={b} size={size} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "center" },
  badge: { alignItems: "center", justifyContent: "center" },
});
