import { useState, useCallback } from "react";
import {
  View, Text, FlatList, Pressable, RefreshControl,
  ActivityIndicator, StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { Typography, Spacing, Radius, Shadows } from "@/constants/design-tokens";

// ─── Notification Type Config ───────────────────────────────

const NOTIF_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  escrow_created:  { icon: "banknote.fill",           color: "#0a7ea4", bg: "#DBEAFE" },
  escrow_funded:   { icon: "lock.fill",               color: "#065F46", bg: "#D1FAE5" },
  escrow_released: { icon: "checkmark.circle.fill",   color: "#22C55E", bg: "#D1FAE5" },
  escrow_disputed: { icon: "exclamationmark.triangle", color: "#991B1B", bg: "#FEE2E2" },
  escrow_resolved: { icon: "checkmark.circle.fill",   color: "#7C3AED", bg: "#F3E8FF" },
  contract_created: { icon: "doc.text.fill",          color: "#0a7ea4", bg: "#DBEAFE" },
  contract_signed:  { icon: "pencil",                 color: "#065F46", bg: "#D1FAE5" },
  status_change:    { icon: "arrow.right",            color: "#B45309", bg: "#FEF3C7" },
  submission_status: { icon: "theatermasks.fill",      color: "#7C3AED", bg: "#F3E8FF" },
  hire:             { icon: "star.fill",              color: "#C9963B", bg: "#FEF3C7" },
  new_message:      { icon: "message.fill",           color: "#0a7ea4", bg: "#DBEAFE" },
  payment_released: { icon: "dollarsign.circle",      color: "#22C55E", bg: "#D1FAE5" },
};

const DEFAULT_CONFIG = { icon: "bell.fill", color: "#6B7280", bg: "#E5E7EB" };

export default function NotificationCenter() {
  const router = useRouter();
  const colors = useColors();
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const notifQuery = trpc.notifications.list.useQuery({
    limit: 100,
    unreadOnly: showUnreadOnly,
  });
  const unreadCountQuery = trpc.notifications.unreadCount.useQuery();
  const utils = trpc.useUtils();

  const markReadMutation = trpc.notifications.markRead.useMutation({
    onSuccess: () => { utils.notifications.list.invalidate(); utils.notifications.unreadCount.invalidate(); },
  });
  const markAllReadMutation = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => { utils.notifications.list.invalidate(); utils.notifications.unreadCount.invalidate(); },
  });
  const deleteMutation = trpc.notifications.delete.useMutation({
    onSuccess: () => { utils.notifications.list.invalidate(); utils.notifications.unreadCount.invalidate(); },
  });

  const isRefreshing = notifQuery.isRefetching;
  const onRefresh = useCallback(() => {
    notifQuery.refetch();
    unreadCountQuery.refetch();
  }, []);

  const items = notifQuery.data?.items || [];
  const unreadCount = unreadCountQuery.data || 0;

  // ─── Deep Link Handler ──────────────────────────────────────

  const handleNotifPress = (notif: any) => {
    // Mark as read
    if (!notif.isRead) {
      markReadMutation.mutate({ notificationId: notif.id });
    }

    // Navigate based on type
    const data = notif.data || {};
    switch (notif.type) {
      case "escrow_created":
      case "escrow_funded":
      case "escrow_released":
      case "escrow_disputed":
      case "escrow_resolved":
      case "payment_released":
        router.push("/payments" as any);
        break;
      case "contract_created":
      case "contract_signed":
      case "status_change":
        if (data.contractId) {
          router.push(`/contract/${data.contractId}` as any);
        }
        break;
      case "submission_status":
      case "hire":
        router.push("/casting/my-submissions" as any);
        break;
      case "new_message":
        router.push("/(tabs)/messages" as any);
        break;
      default:
        break;
    }
  };

  // ─── Time Ago ───────────────────────────────────────────────

  const timeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return then.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // ─── Render ─────────────────────────────────────────────────

  const renderNotifItem = ({ item }: { item: any }) => {
    const config = NOTIF_CONFIG[item.type] || DEFAULT_CONFIG;

    return (
      <Pressable
        onPress={() => handleNotifPress(item)}
        style={({ pressed }) => [
          s.notifCard,
          { backgroundColor: item.isRead ? colors.surface : colors.primary + "08",
            borderColor: item.isRead ? colors.border : colors.primary + "30" },
          pressed && { opacity: 0.7 },
        ]}
      >
        <View style={s.notifRow}>
          {/* Icon */}
          <View style={[s.notifIcon, { backgroundColor: config.bg }]}>
            <IconSymbol name={config.icon} size={18} color={config.color} />
          </View>

          {/* Content */}
          <View style={s.notifContent}>
            <View style={s.notifTitleRow}>
              <Text
                style={[
                  item.isRead ? Typography.bodyMd : Typography.labelLg,
                  { color: colors.foreground, flex: 1 },
                ]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              {!item.isRead && <View style={[s.unreadDot, { backgroundColor: colors.primary }]} />}
            </View>
            <Text style={[Typography.bodySm, { color: colors.muted, marginTop: 2 }]} numberOfLines={2}>
              {item.body}
            </Text>
            <Text style={[Typography.caption, { color: colors.muted, marginTop: Spacing.xs }]}>
              {timeAgo(item.createdAt)}
            </Text>
          </View>

          {/* Delete */}
          <Pressable
            onPress={() => deleteMutation.mutate({ notificationId: item.id })}
            style={({ pressed }) => [s.deleteBtn, pressed && { opacity: 0.5 }]}
          >
            <IconSymbol name="xmark" size={14} color={colors.muted} />
          </Pressable>
        </View>
      </Pressable>
    );
  };

  const renderHeader = () => (
    <View>
      {/* Title Row */}
      <View style={s.titleRow}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
          <IconSymbol name="chevron.left" size={24} color={colors.primary} />
        </Pressable>
        <View style={s.titleCenter}>
          <Text style={[Typography.displaySm, { color: colors.foreground }]}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={[s.badge, { backgroundColor: colors.primary }]}>
              <Text style={[Typography.labelSm, { color: "#FFF" }]}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <Pressable
            onPress={() => markAllReadMutation.mutate()}
            style={({ pressed }) => [pressed && { opacity: 0.6 }]}
          >
            <Text style={[Typography.labelMd, { color: colors.primary }]}>Read All</Text>
          </Pressable>
        )}
      </View>

      {/* Filter Toggle */}
      <View style={s.filterRow}>
        <Pressable
          onPress={() => setShowUnreadOnly(false)}
          style={({ pressed }) => [
            s.filterChip,
            { borderColor: !showUnreadOnly ? colors.primary : colors.border,
              backgroundColor: !showUnreadOnly ? colors.primary + "15" : colors.surface },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text style={[Typography.labelSm, { color: !showUnreadOnly ? colors.primary : colors.muted }]}>All</Text>
        </Pressable>
        <Pressable
          onPress={() => setShowUnreadOnly(true)}
          style={({ pressed }) => [
            s.filterChip,
            { borderColor: showUnreadOnly ? colors.primary : colors.border,
              backgroundColor: showUnreadOnly ? colors.primary + "15" : colors.surface },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text style={[Typography.labelSm, { color: showUnreadOnly ? colors.primary : colors.muted }]}>
            Unread {unreadCount > 0 ? `(${unreadCount})` : ""}
          </Text>
        </Pressable>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={s.emptyState}>
      <IconSymbol name="bell" size={48} color={colors.muted} />
      <Text style={[Typography.bodyMd, { color: colors.muted, marginTop: Spacing.md, textAlign: "center" }]}>
        {showUnreadOnly ? "No unread notifications" : "No notifications yet"}
      </Text>
      <Text style={[Typography.bodySm, { color: colors.muted, marginTop: Spacing.xs, textAlign: "center" }]}>
        You'll be notified about payments, contracts, and casting updates
      </Text>
    </View>
  );

  if (notifQuery.isLoading) {
    return (
      <ScreenContainer className="p-6">
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <FlatList
        data={items}
        keyExtractor={(item: any) => item.id.toString()}
        renderItem={renderNotifItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
      />
    </ScreenContainer>
  );
}

// ─── Styles ─────────────────────────────────────────────────

const s = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  titleCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: Spacing.sm,
    gap: Spacing.sm,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    minWidth: 24,
    alignItems: "center",
  },
  filterRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  notifCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
  },
  notifRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  notifIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  notifContent: {
    flex: 1,
  },
  notifTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  deleteBtn: {
    padding: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.section,
  },
});
