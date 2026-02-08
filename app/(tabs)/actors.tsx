import {
  Text,
  View,
  FlatList,
  Pressable,
  ActivityIndicator,
  TextInput,
  StyleSheet,
} from "react-native";
import { useState, useMemo } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { router } from "expo-router";
import { useColors } from "@/hooks/use-colors";

export default function ActorsTab() {
  const colors = useColors();
  const [search, setSearch] = useState("");
  const { data: actors, isLoading } = trpc.user.getActors.useQuery();

  const filteredActors = useMemo(() => {
    if (!actors) return [];
    if (!search.trim()) return actors;
    const q = search.toLowerCase();
    return actors.filter(
      (a: any) =>
        (a.name || "").toLowerCase().includes(q) ||
        (a.email || "").toLowerCase().includes(q)
    );
  }, [actors, search]);

  const renderActor = ({ item }: { item: any }) => {
    const initials = (item.name || "A")
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    return (
      <Pressable
        onPress={() => router.push(`/actor/${item.id}` as any)}
        style={({ pressed }) => [
          styles.actorRow,
          { borderBottomColor: colors.border },
          pressed && { opacity: 0.7, backgroundColor: colors.surface },
        ]}
      >
        <View
          style={[
            styles.avatar,
            { backgroundColor: colors.primary + "20" },
          ]}
        >
          <Text style={[styles.avatarText, { color: colors.primary }]}>
            {initials}
          </Text>
        </View>
        <View style={styles.actorInfo}>
          <Text
            style={[styles.actorName, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {item.name || "Unnamed Actor"}
          </Text>
          <Text
            style={[styles.actorEmail, { color: colors.muted }]}
            numberOfLines={1}
          >
            {item.email || ""}
          </Text>
        </View>
        <Text style={[styles.chevron, { color: colors.muted }]}>›</Text>
      </Pressable>
    );
  };

  return (
    <ScreenContainer className="flex-1">
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: colors.surface,
              color: colors.foreground,
              borderColor: colors.border,
            },
          ]}
          placeholder="Search actors..."
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredActors}
          renderItem={renderActor}
          keyExtractor={(item: any) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🎭</Text>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                {search ? "No Actors Found" : "No Actors Yet"}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
                {search
                  ? "Try a different search term."
                  : "Actors will appear here once they join the platform."}
              </Text>
            </View>
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchInput: {
    height: 42,
    borderRadius: 21,
    paddingHorizontal: 18,
    fontSize: 16,
    borderWidth: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContainer: {
    flexGrow: 1,
  },
  actorRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
  },
  actorInfo: {
    flex: 1,
  },
  actorName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  actorEmail: {
    fontSize: 14,
  },
  chevron: {
    fontSize: 24,
    fontWeight: "300",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
});
