import { View, Text, TouchableOpacity, Dimensions, StyleSheet, FlatList } from "react-native";
import { Image } from "expo-image";
import { Card, SectionHeader } from "@/components/ui/design-system";
import { Typography, Spacing, Radius } from "@/constants/design-tokens";
import { useColors } from "@/hooks/use-colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_GAP = 4;
const NUM_COLUMNS = 3;
const ITEM_SIZE = (SCREEN_WIDTH - Spacing.lg * 2 - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

export interface PortfolioItem {
  id: number;
  type: "photo" | "video" | "headshot" | "reel";
  uri: string;
  thumbnail?: string;
  title?: string;
  duration?: string;
}

interface Props {
  items: PortfolioItem[];
  onItemPress?: (item: PortfolioItem) => void;
  onAddPress?: () => void;
  editable?: boolean;
}

export function PortfolioGrid({ items, onItemPress, onAddPress, editable = false }: Props) {
  const colors = useColors();
  const accent = (colors as any).accent || "#C9963B";

  const renderItem = ({ item }: { item: PortfolioItem | "add" }) => {
    if (item === "add") {
      return (
        <TouchableOpacity
          onPress={onAddPress}
          activeOpacity={0.7}
          style={[styles.gridItem, {
            backgroundColor: colors.surface,
            borderWidth: 2, borderColor: colors.border,
            borderStyle: "dashed",
          }]}
        >
          <Text style={{ fontSize: 28, color: colors.muted }}>+</Text>
          <Text style={[Typography.caption, { color: colors.muted }]}>Add</Text>
        </TouchableOpacity>
      );
    }

    const isVideo = item.type === "video" || item.type === "reel";

    return (
      <TouchableOpacity
        onPress={() => onItemPress?.(item)}
        activeOpacity={0.85}
        style={styles.gridItem}
      >
        <Image
          source={{ uri: item.thumbnail || item.uri }}
          style={styles.gridImage}
          contentFit="cover"
          transition={200}
        />
        {/* Type Badge */}
        <View style={[styles.typeBadge, {
          backgroundColor: isVideo ? accent : colors.primary,
        }]}>
          <Text style={{ color: "#fff", fontSize: 8, fontWeight: "700" }}>
            {item.type === "headshot" ? "HS" : item.type === "reel" ? "REEL" : item.type === "video" ? "VID" : ""}
          </Text>
        </View>
        {/* Duration overlay for videos */}
        {isVideo && item.duration && (
          <View style={styles.durationBadge}>
            <Text style={{ color: "#fff", fontSize: 10, fontWeight: "600" }}>{item.duration}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const data: (PortfolioItem | "add")[] = editable ? [...items, "add"] : items;

  if (items.length === 0 && !editable) {
    return (
      <Card>
        <View style={{ alignItems: "center", paddingVertical: 24 }}>
          <Text style={{ fontSize: 40 }}>📸</Text>
          <Text style={[Typography.labelMd, { color: colors.foreground, marginTop: 8 }]}>No portfolio items yet</Text>
          <Text style={[Typography.caption, { color: colors.muted, marginTop: 4 }]}>
            Photos, headshots, and reels will appear here
          </Text>
        </View>
      </Card>
    );
  }

  return (
    <View style={{ gap: Spacing.sm }}>
      <SectionHeader
        title="Portfolio"
        subtitle={`${items.length} item${items.length !== 1 ? "s" : ""}`}
      />
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => (item === "add" ? "add" : String(item.id))}
        numColumns={NUM_COLUMNS}
        columnWrapperStyle={{ gap: GRID_GAP }}
        contentContainerStyle={{ gap: GRID_GAP }}
        scrollEnabled={false}
      />
    </View>
  );
}

export function PortfolioStats({ photos, videos, headshots, reels }: {
  photos: number; videos: number; headshots: number; reels: number;
}) {
  const colors = useColors();
  const accent = (colors as any).accent || "#C9963B";

  const stats = [
    { label: "Photos", count: photos, icon: "📸" },
    { label: "Videos", count: videos, icon: "🎥" },
    { label: "Headshots", count: headshots, icon: "🤳" },
    { label: "Reels", count: reels, icon: "🎬" },
  ];

  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      {stats.map((s) => (
        <View key={s.label} style={{
          flex: 1, alignItems: "center", gap: 4,
          paddingVertical: 12, borderRadius: Radius.md,
          backgroundColor: colors.surface,
        }}>
          <Text style={{ fontSize: 18 }}>{s.icon}</Text>
          <Text style={[Typography.labelLg, { color: colors.foreground }]}>{s.count}</Text>
          <Text style={[Typography.caption, { color: colors.muted }]}>{s.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  gridItem: {
    width: ITEM_SIZE, height: ITEM_SIZE,
    borderRadius: 8, overflow: "hidden",
    alignItems: "center", justifyContent: "center",
  },
  gridImage: {
    width: "100%", height: "100%",
  },
  typeBadge: {
    position: "absolute", top: 4, left: 4,
    paddingHorizontal: 4, paddingVertical: 2,
    borderRadius: 4,
  },
  durationBadge: {
    position: "absolute", bottom: 4, right: 4,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4,
  },
});
