import { FlatList, Text, View, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet, TextInput } from "react-native";
import { useState, useCallback } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { router } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { OnboardingOverlay } from "@/components/onboarding/OnboardingTooltip";

type TabKey = "messages" | "talent";

export default function NetworkScreen() {
  const { user, isAuthenticated } = useAuth();
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("messages");
  const [searchQuery, setSearchQuery] = useState("");

  const isProducer = user?.userRole === "producer";

  const { data: conversations, isLoading: convsLoading, refetch: refetchConvs } = trpc.messaging.getConversations.useQuery(
    undefined,
    { enabled: isAuthenticated && !!user?.userRole }
  );

  const { data: unreadCount } = trpc.messaging.getUnreadCount.useQuery(
    undefined,
    { enabled: isAuthenticated && !!user?.userRole }
  );

  // For producers, show actors; for actors, show producers
  const { data: actorsList, isLoading: actorsLoading, refetch: refetchActors } = trpc.user.getActors.useQuery(
    undefined,
    { enabled: isAuthenticated && !!user?.userRole && isProducer }
  );
  const { data: producersList, isLoading: producersLoading, refetch: refetchProducers } = trpc.producers.getAllProducers.useQuery(
    undefined,
    { enabled: isAuthenticated && !!user?.userRole && !isProducer }
  );
  const talentList = isProducer ? actorsList : producersList;
  const talentLoading = isProducer ? actorsLoading : producersLoading;
  const refetchTalent = isProducer ? refetchActors : refetchProducers;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (activeTab === "messages") await refetchConvs();
    else await refetchTalent();
    setRefreshing(false);
  }, [activeTab, refetchConvs, refetchTalent]);

  const filteredTalent = talentList?.filter((t: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return t.name?.toLowerCase().includes(q) || t.email?.toLowerCase().includes(q);
  }) || [];

  const renderConversation = ({ item }: { item: any }) => {
    const otherName = item.otherUserName || "Unknown";
    const initials = otherName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
    const hasUnread = item.unreadCount > 0;

    return (
      <TouchableOpacity
        onPress={() => router.push(`/messages/${item.id}` as any)}
        style={[styles.convCard, { backgroundColor: hasUnread ? colors.primary + "08" : colors.surface, borderColor: colors.border }]}
        activeOpacity={0.7}
      >
        <View style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.convHeader}>
            <Text style={[styles.convName, { color: colors.foreground, fontWeight: hasUnread ? "800" : "600" }]} numberOfLines={1}>
              {otherName}
            </Text>
            {item.lastMessageAt && (
              <Text style={[styles.convTime, { color: colors.muted }]}>
                {formatTime(item.lastMessageAt)}
              </Text>
            )}
          </View>
          <View style={styles.convPreviewRow}>
            <Text
              style={[styles.convPreview, { color: hasUnread ? colors.foreground : colors.muted, fontWeight: hasUnread ? "600" : "400" }]}
              numberOfLines={1}
            >
              {item.lastMessagePreview || "Start a conversation"}
            </Text>
            {hasUnread && (
              <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.unreadText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderTalentCard = ({ item }: { item: any }) => {
    const initials = (item.name || "?").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

    return (
      <TouchableOpacity
        onPress={() => {
          if (isProducer) router.push(`/actor/${item.id}` as any);
          else router.push(`/producer/${item.id}` as any);
        }}
        style={[styles.talentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        activeOpacity={0.7}
      >
        <View style={[styles.talentAvatar, { backgroundColor: colors.primary + "15" }]}>
          <Text style={[styles.talentAvatarText, { color: colors.primary }]}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.talentName, { color: colors.foreground }]} numberOfLines={1}>
            {item.name || "Unknown"}
          </Text>
          <Text style={[styles.talentRole, { color: colors.muted }]}>
            {isProducer ? "Actor" : "Producer"}
            {item.isVerified ? " · Verified" : ""}
          </Text>
        </View>
        <IconSymbol name="chevron.right" size={18} color={colors.muted} />
      </TouchableOpacity>
    );
  };

  if (!isAuthenticated || !user?.userRole) return null;

  const isLoading = activeTab === "messages" ? convsLoading : talentLoading;
  const data = activeTab === "messages" ? (conversations || []) : filteredTalent;

  return (
    <ScreenContainer>
      <View style={styles.headerContainer}>
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>Network</Text>

        {/* Tab switcher */}
        <View style={[styles.tabRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => setActiveTab("messages")}
            style={[styles.tab, activeTab === "messages" && { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
          >
            <IconSymbol name="message.fill" size={16} color={activeTab === "messages" ? "#fff" : colors.muted} />
            <Text style={[styles.tabText, { color: activeTab === "messages" ? "#fff" : colors.muted }]}>
              Messages {(unreadCount?.count ?? 0) > 0 ? `(${unreadCount?.count})` : ""}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("talent")}
            style={[styles.tab, activeTab === "talent" && { backgroundColor: colors.primary }]}
            activeOpacity={0.8}
          >
            <IconSymbol name="person.2.fill" size={16} color={activeTab === "talent" ? "#fff" : colors.muted} />
            <Text style={[styles.tabText, { color: activeTab === "talent" ? "#fff" : colors.muted }]}>
              {isProducer ? "Actors" : "Producers"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search bar for talent tab */}
        {activeTab === "talent" && (
          <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <IconSymbol name="magnifyingglass" size={18} color={colors.muted} />
            <TextInput
              style={[styles.searchInput, { color: colors.foreground }]}
              placeholder={`Search ${isProducer ? "actors" : "producers"}...`}
              placeholderTextColor={colors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
          </View>
        )}
      </View>

      <FlatList
        data={isLoading ? [] : data}
        renderItem={activeTab === "messages" ? renderConversation : renderTalentCard}
        keyExtractor={(item: any) => item.id.toString()}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <View style={[styles.emptyContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={styles.emptyIcon}>{activeTab === "messages" ? "💬" : "🎭"}</Text>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                {activeTab === "messages" ? "No Messages" : `No ${isProducer ? "Actors" : "Producers"} Found`}
              </Text>
              <Text style={[styles.emptyMessage, { color: colors.muted }]}>
                {activeTab === "messages"
                  ? "Start a conversation from a profile or contract"
                  : searchQuery
                  ? "Try a different search term"
                  : `Browse ${isProducer ? "actors" : "producers"} to connect`}
              </Text>
            </View>
          )
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      />
      {/* Onboarding: producer_network step */}
      <OnboardingOverlay screen="network" />
    </ScreenContainer>
  );
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const styles = StyleSheet.create({
  headerContainer: { paddingHorizontal: 16, paddingTop: 8, gap: 12, paddingBottom: 8 },
  screenTitle: { fontSize: 28, fontWeight: "800" },
  tabRow: { flexDirection: "row", borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10 },
  tabText: { fontSize: 14, fontWeight: "600" },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 15, padding: 0 },
  listContent: { paddingHorizontal: 16, paddingBottom: 100, gap: 8 },
  convCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 16, fontWeight: "700" },
  convHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  convName: { fontSize: 15, flex: 1 },
  convTime: { fontSize: 12, marginLeft: 8 },
  convPreviewRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  convPreview: { fontSize: 13, flex: 1 },
  unreadBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10, minWidth: 20, alignItems: "center", marginLeft: 8 },
  unreadText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  talentCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  talentAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  talentAvatarText: { fontSize: 15, fontWeight: "700" },
  talentName: { fontSize: 15, fontWeight: "600" },
  talentRole: { fontSize: 13, marginTop: 1 },
  loadingContainer: { paddingTop: 60, alignItems: "center" },
  emptyContainer: { borderRadius: 16, padding: 32, alignItems: "center", gap: 10, borderWidth: 1, marginTop: 20 },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptyMessage: { fontSize: 14, textAlign: "center", maxWidth: 260 },
});
