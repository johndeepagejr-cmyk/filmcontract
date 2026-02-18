import { FlatList, Text, View, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet, TextInput } from "react-native";
import { useState, useCallback, useMemo } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { router } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";

type FilterKey = "all" | "film" | "commercial" | "tv" | "voice_over";

export default function CastingCallsFeed() {
  const { user } = useAuth();
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  const isProducer = user?.userRole === "producer";

  const { data: castingCalls, isLoading, refetch } = isProducer
    ? trpc.casting.listMine.useQuery()
    : trpc.casting.listOpen.useQuery();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const filteredCalls = useMemo(() => {
    if (!castingCalls) return [];
    let filtered = [...castingCalls];

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((c: any) =>
        c.title?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.producerName?.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (activeFilter !== "all") {
      filtered = filtered.filter((c: any) => {
        try {
          const roles = c.roles ? JSON.parse(c.roles) : [];
          return roles.some((r: any) => r.type === activeFilter);
        } catch {
          return true;
        }
      });
    }

    return filtered;
  }, [castingCalls, searchQuery, activeFilter]);

  const getDaysLeft = (deadline: string | null) => {
    if (!deadline) return null;
    const diff = new Date(deadline).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return "Expired";
    if (days === 0) return "Today";
    if (days === 1) return "1 day left";
    return `${days} days left`;
  };

  const parseRoles = (rolesStr: string | null) => {
    if (!rolesStr) return [];
    try { return JSON.parse(rolesStr); } catch { return []; }
  };

  const renderCastingCard = ({ item }: { item: any }) => {
    const roles = parseRoles(item.roles);
    const daysLeft = getDaysLeft(item.deadline);
    const isUrgent = daysLeft && (daysLeft === "Today" || daysLeft === "1 day left");

    return (
      <TouchableOpacity
        onPress={() => router.push(`/casting/${item.id}` as any)}
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        activeOpacity={0.7}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={[styles.producerBadge, { backgroundColor: colors.primary + "15" }]}>
            <Text style={[styles.producerInitial, { color: colors.primary }]}>
              {(item.producerName || "P")[0].toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={[styles.producerName, { color: colors.muted }]} numberOfLines={1}>
              {item.producerName || "Production Company"}
            </Text>
          </View>
          {item.status === "open" && (
            <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
          )}
        </View>

        {/* Description */}
        <Text style={[styles.description, { color: colors.muted }]} numberOfLines={2}>
          {item.description}
        </Text>

        {/* Roles tags */}
        {roles.length > 0 && (
          <View style={styles.tagsRow}>
            {roles.slice(0, 3).map((role: any, idx: number) => (
              <View key={idx} style={[styles.tag, { backgroundColor: colors.primary + "12" }]}>
                <Text style={[styles.tagText, { color: colors.primary }]}>
                  {role.name || role.type || "Role"}
                </Text>
              </View>
            ))}
            {roles.length > 3 && (
              <Text style={[styles.moreRoles, { color: colors.muted }]}>+{roles.length - 3} more</Text>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.cardFooter}>
          {item.budget && (
            <View style={styles.footerItem}>
              <IconSymbol name="dollarsign.circle" size={14} color={colors.success} />
              <Text style={[styles.footerText, { color: colors.foreground }]}>
                ${parseFloat(item.budget).toLocaleString()}
              </Text>
            </View>
          )}
          {daysLeft && (
            <View style={styles.footerItem}>
              <IconSymbol name="calendar" size={14} color={isUrgent ? colors.error : colors.muted} />
              <Text style={[styles.footerText, { color: isUrgent ? colors.error : colors.muted, fontWeight: isUrgent ? "700" : "500" }]}>
                {daysLeft}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const filters: { key: FilterKey; label: string }[] = [
    { key: "all", label: "All" },
    { key: "film", label: "Film" },
    { key: "commercial", label: "Commercial" },
    { key: "tv", label: "TV" },
    { key: "voice_over", label: "Voice Over" },
  ];

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <IconSymbol name="arrow.left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.screenTitle, { color: colors.foreground }]}>
            {isProducer ? "My Casting Calls" : "Casting Calls"}
          </Text>
          {isProducer && (
            <TouchableOpacity
              onPress={() => router.push("/casting/create" as any)}
              style={[styles.createBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.8}
            >
              <IconSymbol name="plus" size={18} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Search */}
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <IconSymbol name="magnifyingglass" size={18} color={colors.muted} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search casting calls..."
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
        </View>

        {/* Filter chips */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filters}
          renderItem={({ item: f }) => (
            <TouchableOpacity
              onPress={() => setActiveFilter(f.key)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: activeFilter === f.key ? colors.primary : colors.surface,
                  borderColor: activeFilter === f.key ? colors.primary : colors.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, { color: activeFilter === f.key ? "#fff" : colors.foreground }]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.filterRow}
        />
      </View>

      <FlatList
        data={isLoading ? [] : filteredCalls}
        renderItem={renderCastingCard}
        keyExtractor={(item: any) => item.id.toString()}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <View style={[styles.emptyContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={styles.emptyIcon}>🎬</Text>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                {searchQuery ? "No Results" : isProducer ? "No Casting Calls" : "No Open Casting Calls"}
              </Text>
              <Text style={[styles.emptyMessage, { color: colors.muted }]}>
                {searchQuery
                  ? "Try adjusting your search or filters"
                  : isProducer
                  ? "Create your first casting call to find talent"
                  : "Check back soon for new opportunities"}
              </Text>
              {isProducer && !searchQuery && (
                <TouchableOpacity
                  onPress={() => router.push("/casting/create" as any)}
                  style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.emptyBtnText}>Create Casting Call</Text>
                </TouchableOpacity>
              )}
            </View>
          )
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingTop: 8, gap: 12, paddingBottom: 8 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: { padding: 4 },
  screenTitle: { fontSize: 24, fontWeight: "800", flex: 1 },
  createBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 15, padding: 0 },
  filterRow: { gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 13, fontWeight: "600" },
  listContent: { paddingHorizontal: 16, paddingBottom: 100, gap: 12 },
  card: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 10 },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  producerBadge: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  producerInitial: { fontSize: 16, fontWeight: "700" },
  cardTitle: { fontSize: 16, fontWeight: "700", lineHeight: 22 },
  producerName: { fontSize: 13, marginTop: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  description: { fontSize: 13, lineHeight: 19 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, alignItems: "center" },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  tagText: { fontSize: 12, fontWeight: "600" },
  moreRoles: { fontSize: 12, marginLeft: 2 },
  cardFooter: { flexDirection: "row", alignItems: "center", gap: 16 },
  footerItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  footerText: { fontSize: 13, fontWeight: "500" },
  loadingContainer: { paddingTop: 60, alignItems: "center" },
  emptyContainer: { borderRadius: 16, padding: 32, alignItems: "center", gap: 10, borderWidth: 1, marginTop: 20 },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptyMessage: { fontSize: 14, textAlign: "center", maxWidth: 260 },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, marginTop: 8 },
  emptyBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
